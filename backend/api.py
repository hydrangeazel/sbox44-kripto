from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add parent directory to path to import modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

# Import functions from ui_sbox_modifier
from components.ui_sbox_modifier import (
    validate_affine_matrix,
    generate_sbox_from_affine,
    AES_AFFINE_MATRIX,
    AES_AFFINE_CONSTANT
)
from analytics import (
    calc_nl_measure, calc_sac_measure, calc_bic_nl_measure, calc_bic_sac_measure
)
from aes_engine.utils import SBOX

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/validate-matrix', methods=['POST'])
def validate_matrix():
    """Validasi matriks affine 8x8"""
    try:
        data = request.json
        matrix = data.get('matrix')
        if not matrix:
            return jsonify({'error': 'Matrix is required'}), 400
        
        is_valid, det, is_balanced, is_bijective, message = validate_affine_matrix(matrix)
        
        return jsonify({
            'is_valid': is_valid,
            'determinant': det,
            'is_balanced': is_balanced,
            'is_bijective': is_bijective,
            'message': message
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-sbox', methods=['POST'])
def generate_sbox():
    """Generate S-box dari matriks affine"""
    try:
        data = request.json
        matrix = data.get('matrix')
        constant = data.get('constant', AES_AFFINE_CONSTANT)
        
        if not matrix:
            return jsonify({'error': 'Matrix is required'}), 400
        
        # Validasi dulu
        is_valid, det, _, _, _ = validate_affine_matrix(matrix)
        if not is_valid:
            return jsonify({'error': 'Matrix is not valid'}), 400
        
        sbox = generate_sbox_from_affine(matrix, constant)
        
        return jsonify({
            'sbox': sbox,
            'matrix': matrix,
            'constant': constant
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/evaluate-security', methods=['POST'])
def evaluate_security():
    """Evaluasi keamanan S-box"""
    try:
        data = request.json
        sbox = data.get('sbox')
        
        if not sbox or len(sbox) != 256:
            return jsonify({'error': 'Valid S-box (256 elements) is required'}), 400
        
        nl = calc_nl_measure(sbox)
        sac = calc_sac_measure(sbox)
        bic_nl = calc_bic_nl_measure(sbox)
        bic_sac = calc_bic_sac_measure(sbox)
        
        # Hitung skor keamanan
        nl_score = (nl / 112.0) * 100
        sac_score = (1.0 - abs(sac - 0.5) * 2) * 100
        bic_nl_score = (bic_nl / 112.0) * 100
        bic_sac_score = max(0, (1.0 - bic_sac) * 100)
        total_score = (nl_score * 0.3 + sac_score * 0.3 + bic_nl_score * 0.2 + bic_sac_score * 0.2)
        
        return jsonify({
            'nl': nl,
            'sac': sac,
            'bic_nl': bic_nl,
            'bic_sac': bic_sac,
            'score': total_score
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/standard-sbox', methods=['GET'])
def get_standard_sbox():
    """Get standard AES S-box"""
    return jsonify({
        'sbox': SBOX
    })

@app.route('/api/standard-metrics', methods=['GET'])
def get_standard_metrics():
    """Get standard AES S-box metrics"""
    nl = calc_nl_measure(SBOX)
    sac = calc_sac_measure(SBOX)
    bic_nl = calc_bic_nl_measure(SBOX)
    bic_sac = calc_bic_sac_measure(SBOX)
    
    nl_score = (nl / 112.0) * 100
    sac_score = (1.0 - abs(sac - 0.5) * 2) * 100
    bic_nl_score = (bic_nl / 112.0) * 100
    bic_sac_score = max(0, (1.0 - bic_sac) * 100)
    total_score = (nl_score * 0.3 + sac_score * 0.3 + bic_nl_score * 0.2 + bic_sac_score * 0.2)
    
    return jsonify({
        'nl': nl,
        'sac': sac,
        'bic_nl': bic_nl,
        'bic_sac': bic_sac,
        'score': total_score
    })

@app.route('/api/default-matrix', methods=['GET'])
def get_default_matrix():
    """Get default AES affine matrix"""
    return jsonify({
        'matrix': AES_AFFINE_MATRIX,
        'constant': AES_AFFINE_CONSTANT
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)


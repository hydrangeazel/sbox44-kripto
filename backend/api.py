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
    generate_affine_matrix_from_first_row,
    AES_AFFINE_MATRIX,
    AES_AFFINE_CONSTANT
)
from analytics import (
    calc_nl_measure, calc_sac_measure, calc_bic_nl_measure, calc_bic_sac_measure,
    calc_lap_measure, calc_dap_measure, calc_to_measure, calc_du_measure, calc_ad_measure,
    calc_ci_measure, check_sbox_basic_properties
)
from aes_engine.utils import SBOX
from aes_engine.modes import AESModes
from image_engine.encoder import encrypt_image
from image_engine.decoder import decrypt_image
from PIL import Image
import base64
import io
import json
import os
import time
import math
import random
from collections import Counter

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

def calculate_security_score(nl, sac, bic_nl, bic_sac):
    """Calculate security score from metrics (extracted to avoid duplication)"""
    nl_score = (nl / 112.0) * 100
    sac_score = (1.0 - abs(sac - 0.5) * 2) * 100
    bic_nl_score = (bic_nl / 112.0) * 100
    bic_sac_score = max(0, (1.0 - bic_sac) * 100)
    total_score = (nl_score * 0.3 + sac_score * 0.3 + bic_nl_score * 0.2 + bic_sac_score * 0.2)
    return total_score

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
        
        # Validate constant is a valid 8-bit value
        try:
            constant = int(constant) & 0xFF
        except (ValueError, TypeError):
            return jsonify({'error': 'Constant must be a valid integer (0-255)'}), 400
        
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
        
        # 1. Basic Properties: Bijective & Balanced (Check first)
        basic_props = check_sbox_basic_properties(sbox)
        
        # 2. Existing metrics
        nl = calc_nl_measure(sbox)
        sac = calc_sac_measure(sbox)
        bic_nl = calc_bic_nl_measure(sbox)
        bic_sac = calc_bic_sac_measure(sbox)
        
        # 3. New metrics
        lap = calc_lap_measure(sbox)
        dap = calc_dap_measure(sbox)
        du = calc_du_measure(sbox)
        ad = calc_ad_measure(sbox)
        to = calc_to_measure(sbox)
        ci = calc_ci_measure(sbox)
        
        # Hitung skor keamanan menggunakan fungsi terpusat
        total_score = calculate_security_score(nl, sac, bic_nl, bic_sac)
        
        return jsonify({
            # Basic Properties
            'is_bijective': basic_props['is_bijective'],
            'is_balanced': basic_props['is_balanced'],
            'is_valid': basic_props['is_valid'],
            'bijective_message': basic_props['bijective_message'],
            'balanced_message': basic_props['balanced_message'],
            # Existing metrics
            'nl': nl,
            'sac': sac,
            'bic_nl': bic_nl,
            'bic_sac': bic_sac,
            # New metrics
            'lap': lap,
            'dap': dap,
            'du': du,
            'ad': ad,
            'to': to,
            'ci': ci,
            # Score
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
    # 1. Basic Properties: Bijective & Balanced
    basic_props = check_sbox_basic_properties(SBOX)
    
    # 2. Existing metrics
    nl = calc_nl_measure(SBOX)
    sac = calc_sac_measure(SBOX)
    bic_nl = calc_bic_nl_measure(SBOX)
    bic_sac = calc_bic_sac_measure(SBOX)
    
    # 3. New metrics
    lap = calc_lap_measure(SBOX)
    dap = calc_dap_measure(SBOX)
    du = calc_du_measure(SBOX)
    ad = calc_ad_measure(SBOX)
    to = calc_to_measure(SBOX)
    ci = calc_ci_measure(SBOX)
    
    # Hitung skor keamanan menggunakan fungsi terpusat
    total_score = calculate_security_score(nl, sac, bic_nl, bic_sac)
    
    return jsonify({
        # Basic Properties
        'is_bijective': basic_props['is_bijective'],
        'is_balanced': basic_props['is_balanced'],
        'is_valid': basic_props['is_valid'],
        'bijective_message': basic_props['bijective_message'],
        'balanced_message': basic_props['balanced_message'],
        # Existing metrics
        'nl': nl,
        'sac': sac,
        'bic_nl': bic_nl,
        'bic_sac': bic_sac,
        # New metrics
        'lap': lap,
        'dap': dap,
        'du': du,
        'ad': ad,
        'to': to,
        'ci': ci,
        # Score
        'score': total_score
    })

@app.route('/api/default-matrix', methods=['GET'])
def get_default_matrix():
    """Get default AES affine matrix"""
    return jsonify({
        'matrix': AES_AFFINE_MATRIX,
        'constant': AES_AFFINE_CONSTANT
    })

@app.route('/api/generate-matrix', methods=['POST'])
def generate_matrix():
    """
    Generate 8x8 affine matrix from first row using Right Circular Shift.
    Based on paper "AES S-box modification uses affine matrices exploration".
    """
    try:
        data = request.json
        first_row = data.get('first_row')
        
        if not first_row:
            return jsonify({'error': 'first_row is required'}), 400
        
        if not isinstance(first_row, list) or len(first_row) != 8:
            return jsonify({'error': 'first_row must be a list of 8 integers (0 or 1)'}), 400
        
        # Generate matrix using right circular shift
        matrix, is_valid, det, message = generate_affine_matrix_from_first_row(first_row)
        
        if matrix is None:
            return jsonify({'error': message}), 400
        
        return jsonify({
            'matrix': matrix,
            'is_valid': is_valid,
            'determinant': det,
            'message': message
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def load_sbox44():
    """Load S-box44 from JSON file"""
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(current_dir, 'assets', 'sbox44.json')
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
            sbox_values = data.get('sbox44') or data.get('sbox')
            if not sbox_values or len(sbox_values) != 256:
                return None
            return sbox_values
    except:
        return None

@app.route('/api/encrypt-text', methods=['POST'])
def encrypt_text():
    """Encrypt text using AES"""
    try:
        data = request.json
        plaintext = data.get('plaintext')
        key = data.get('key')
        mode = data.get('mode', 'ECB')
        iv = data.get('iv', '')
        use_sbox44 = data.get('use_sbox44', False)
        
        if not plaintext:
            return jsonify({'error': 'Plaintext is required'}), 400
        if not key or len(key) != 16:
            return jsonify({'error': 'Key must be exactly 16 characters'}), 400
        if mode == 'CBC' and (not iv or len(iv) != 16):
            return jsonify({'error': 'IV must be exactly 16 characters for CBC mode'}), 400
        
        cipher = AESModes(key, use_sbox44=use_sbox44)
        if mode == 'ECB':
            ciphertext_bytes = cipher.encrypt_ecb(plaintext)
        else:
            ciphertext_bytes = cipher.encrypt_cbc(plaintext, iv)
        
        return jsonify({
            'ciphertext_hex': ciphertext_bytes.hex(),
            'ciphertext_b64': base64.b64encode(ciphertext_bytes).decode('utf-8'),
            'length': len(ciphertext_bytes)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/decrypt-text', methods=['POST'])
def decrypt_text():
    """Decrypt text using AES"""
    try:
        data = request.json
        ciphertext_hex = data.get('ciphertext_hex')
        key = data.get('key')
        mode = data.get('mode', 'ECB')
        iv = data.get('iv', '')
        use_sbox44 = data.get('use_sbox44', False)
        
        if not ciphertext_hex:
            return jsonify({'error': 'Ciphertext is required'}), 400
        if not key or len(key) != 16:
            return jsonify({'error': 'Key must be exactly 16 characters'}), 400
        if mode == 'CBC' and (not iv or len(iv) != 16):
            return jsonify({'error': 'IV must be exactly 16 characters for CBC mode'}), 400
        
        ciphertext_bytes = bytes.fromhex(ciphertext_hex)
        cipher = AESModes(key, use_sbox44=use_sbox44)
        
        if mode == 'ECB':
            decrypted = cipher.decrypt_ecb(ciphertext_bytes)
        else:
            decrypted = cipher.decrypt_cbc(ciphertext_bytes, iv)
        
        return jsonify({
            'plaintext': decrypted.decode('utf-8', errors='ignore')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-ciphertext', methods=['POST'])
def analyze_ciphertext():
    """Analisis statistik ciphertext dengan perhitungan kriptografi"""
    try:
        data = request.json
        ciphertext_hex = data.get('ciphertext_hex')
        
        if not ciphertext_hex:
            return jsonify({'error': 'Ciphertext is required'}), 400
        
        ciphertext_bytes = bytes.fromhex(ciphertext_hex)
        total_bytes = len(ciphertext_bytes)
        
        # ===== 1. SHANNON ENTROPY (Base 2) =====
        byte_counts = Counter(ciphertext_bytes)
        entropy = 0.0
        for count in byte_counts.values():
            probability = count / total_bytes
            if probability > 0:
                entropy -= probability * math.log2(probability)
        
        # ===== 2. CHI-SQUARE TEST (Uniformity Test) =====
        # Chi-square test untuk menguji apakah distribusi byte uniform
        # Expected frequency = total_bytes / 256 (karena ada 256 kemungkinan byte)
        # Rumus: χ² = Σ((Observed - Expected)² / Expected)
        # Dimana Expected = total_bytes / 256
        expected_freq = total_bytes / 256.0
        chi_square = 0.0
        
        # Hitung chi-square untuk semua 256 kemungkinan byte
        # Hanya hitung jika expected_freq > 0 (menghindari division by zero)
        if expected_freq > 0:
            for byte_value in range(256):
                observed_count = byte_counts.get(byte_value, 0)
                # Rumus: (Observed - Expected)² / Expected
                chi_square += ((observed_count - expected_freq) ** 2) / expected_freq
        
        # ===== 3. AVALANCHE EFFECT (Fixed Logic) =====
        avalanche_score = None
        if data.get('plaintext') and data.get('key'):
            try:
                plaintext = data.get('plaintext')
                key = data.get('key')
                use_sbox44 = data.get('use_sbox44', False)
                mode = data.get('mode', 'ECB')
                iv = data.get('iv', '')
                
                # Konversi plaintext ke bytes jika string
                if isinstance(plaintext, str):
                    plaintext_bytes = plaintext.encode('utf-8')
                else:
                    plaintext_bytes = plaintext
                
                # Inisialisasi cipher
                cipher = AESModes(key, use_sbox44=use_sbox44)
                
                # Step a: Generate Ciphertext_1 dari plaintext asli
                if mode == 'ECB':
                    ciphertext_1 = cipher.encrypt_ecb(plaintext)
                else:
                    ciphertext_1 = cipher.encrypt_cbc(plaintext, iv)
                
                # Step b: Flip tepat 1 bit pada plaintext secara acak
                # Pilih posisi bit secara acak
                if len(plaintext_bytes) > 0:
                    # Pilih byte secara acak
                    byte_pos = random.randint(0, len(plaintext_bytes) - 1)
                    # Pilih bit dalam byte tersebut secara acak (0-7)
                    bit_pos = random.randint(0, 7)
                    
                    # Flip bit tersebut
                    modified_bytes = bytearray(plaintext_bytes)
                    modified_bytes[byte_pos] ^= (1 << bit_pos)  # XOR dengan bit mask
                    modified_plaintext = bytes(modified_bytes)
                    
                    # Step c: Generate Ciphertext_2 dari plaintext yang sudah diubah
                    if mode == 'ECB':
                        ciphertext_2 = cipher.encrypt_ecb(modified_plaintext)
                    else:
                        ciphertext_2 = cipher.encrypt_cbc(modified_plaintext, iv)
                    
                    # Step d: Hitung Hamming Distance (jumlah bit yang berbeda)
                    # Gunakan panjang yang sama untuk perbandingan (ambil yang lebih pendek)
                    min_len = min(len(ciphertext_1), len(ciphertext_2))
                    
                    # 1. Inisialisasi
                    total_bit_difference = 0
                    total_bits = 0
                    
                    # 2. Loop ke seluruh byte ciphertext
                    for i in range(min_len):
                        byte1 = ciphertext_1[i]
                        byte2 = ciphertext_2[i]
                        
                        # 3. Hitung Hamming Distance (jumlah bit beda) antara cipher1[i] dan cipher2[i]
                        xor_result = byte1 ^ byte2
                        bit_difference = bin(xor_result).count('1')
                        
                        # 4. Tambahkan ke totalBitDifference
                        total_bit_difference += bit_difference
                        
                        # 5. Tambahkan 8 ke totalBits
                        total_bits += 8
                    
                    # 6. SETELAH LOOP SELESAI, hitung persentase
                    # avalancheScore = (totalBitDifference / totalBits)
                    # Hasil harus antara 0.0 - 1.0 (akan dikonversi ke persentase di frontend)
                    if total_bits > 0:
                        avalanche_score = total_bit_difference / total_bits
                    else:
                        avalanche_score = 0.0
                else:
                    avalanche_score = 0.0
                    
            except Exception as e:
                # Log error untuk debugging
                print(f"Error calculating avalanche effect: {e}")
                avalanche_score = None
        
        return jsonify({
            'entropy': entropy,
            'max_entropy': 8.0,  # Maximum entropy untuk byte (8 bits)
            'chi_square': chi_square,
            'byte_distribution': dict(byte_counts),
            'unique_bytes': len(byte_counts),
            'total_bytes': total_bytes,
            'avalanche_score': avalanche_score
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/encrypt-image', methods=['POST'])
def encrypt_image_api():
    """Encrypt image using AES"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'Image file is required'}), 400
        
        key = request.form.get('key')
        use_sbox44 = request.form.get('use_sbox44', 'false').lower() == 'true'
        
        if not key or len(key) != 16:
            return jsonify({'error': 'Key must be exactly 16 characters'}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read image file
        image_data = image_file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary (handles RGBA, P, etc.)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        encrypted_img = encrypt_image(image, key, use_sbox44=use_sbox44)
        
        # Convert to base64
        buffer = io.BytesIO()
        encrypted_img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return jsonify({
            'image_b64': img_str,
            'format': 'PNG'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/decrypt-image', methods=['POST'])
def decrypt_image_api():
    """Decrypt image using AES"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'Image file is required'}), 400
        
        key = request.form.get('key')
        use_sbox44 = request.form.get('use_sbox44', 'false').lower() == 'true'
        
        if not key or len(key) != 16:
            return jsonify({'error': 'Key must be exactly 16 characters'}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read image file
        image_data = image_file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        decrypted_img = decrypt_image(image, key, use_sbox44=use_sbox44)
        
        # Convert to base64
        buffer = io.BytesIO()
        decrypted_img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return jsonify({
            'image_b64': img_str,
            'format': 'PNG'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/compare-encrypt', methods=['POST'])
def compare_encrypt():
    """Encrypt data for comparison"""
    try:
        data = request.json
        plaintext = data.get('plaintext')
        key = data.get('key')
        use_sbox44 = data.get('use_sbox44', False)
        output_format = data.get('output_format', 'Hex')
        
        if not plaintext:
            return jsonify({'error': 'Plaintext is required'}), 400
        if not key or len(key) != 16:
            return jsonify({'error': 'Key must be exactly 16 characters'}), 400
        
        cipher = AESModes(key, use_sbox44=use_sbox44)
        if use_sbox44:
            encrypted = cipher.encrypt_cbc(plaintext, "vektorinisial123")
        else:
            encrypted = cipher.encrypt_ecb(plaintext)
        
        if output_format == 'Hex':
            output = encrypted.hex()
        else:
            output = base64.b64encode(encrypted).decode()
        
        return jsonify({
            'ciphertext': output,
            'format': output_format
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/compare-metrics', methods=['GET'])
def compare_metrics():
    """Get cryptographic metrics for comparison"""
    try:
        use_sbox44 = request.args.get('use_sbox44', 'false').lower() == 'true'
        
        sbox = load_sbox44() if use_sbox44 else SBOX
        if sbox is None:
            return jsonify({'error': 'S-box not found'}), 404
        
        start_time = time.time()
        # Basic Properties
        basic_props = check_sbox_basic_properties(sbox)
        # Existing metrics
        nl_val = calc_nl_measure(sbox)
        sac_val = calc_sac_measure(sbox)
        bic_nl_val = calc_bic_nl_measure(sbox)
        bic_sac_val = calc_bic_sac_measure(sbox)
        # New metrics
        lap_val = calc_lap_measure(sbox)
        dap_val = calc_dap_measure(sbox)
        to_val = calc_to_measure(sbox)
        du_val = calc_du_measure(sbox)
        ad_val = calc_ad_measure(sbox)
        ci_val = calc_ci_measure(sbox)
        elapsed_time = int((time.time() - start_time) * 1000)
        
        return jsonify({
            # Basic Properties
            'is_bijective': basic_props['is_bijective'],
            'is_balanced': basic_props['is_balanced'],
            # Existing metrics
            'nl': nl_val,
            'sac': sac_val,
            'bic_nl': bic_nl_val,
            'bic_sac': bic_sac_val,
            # New metrics
            'lap': lap_val,
            'dap': dap_val,
            'to': to_val,
            'du': du_val,
            'ad': ad_val,
            'ci': ci_val,
            'time_ms': elapsed_time
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)


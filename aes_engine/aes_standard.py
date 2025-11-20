# aes_engine/aes_standard.py

from .utils import SBOX, INV_SBOX, RCON, gmul

class AES:
    def __init__(self, key, sbox=None):
        """
        Inisialisasi AES dengan Key dan S-box opsional.
        Jika sbox tidak diisi, otomatis pakai SBOX standar.
        """
        self.sbox = sbox if sbox else SBOX
        
        # Validasi key harus 16 bytes (128 bit)
        if len(key) != 16:
            raise ValueError("Key harus 16 bytes (128 bit)!")

        # Setup Inverse S-box (Wajib untuk Decrypt)
        if sbox:
            # Jika pakai S-box custom (sbox44), kita harus generate inverse-nya
            self.inv_sbox = [0] * 256
            for i, val in enumerate(self.sbox):
                self.inv_sbox[val] = i
        else:
            # Jika pakai standar, ambil langsung dari utils
            self.inv_sbox = INV_SBOX
            
        self.round_keys = self._key_expansion(key)

    def _key_expansion(self, key):
        """Mengembangkan key 16 byte menjadi 176 byte (untuk 11 round key)."""
        key_symbols = [k for k in key]
        Nk = 4; Nr = 10
        
        w = list(key_symbols)
        i = Nk
        while i < 4 * (Nr + 1):
            temp = w[4*(i-1) : 4*i]
            if i % Nk == 0:
                temp = self._rot_word(temp)
                # Perhatikan: Key Expansion SELALU pakai SBOX standar (sesuai spek AES),
                # meskipun data-nya dienkripsi pakai S-box44.
                # Kecuali desain sbox44 mu mengubah key schedule juga (jarang terjadi).
                # Di sini kita asumsikan key schedule tetap standar.
                temp = [SBOX[b] for b in temp] 
                temp[0] = temp[0] ^ RCON[i // Nk]
            
            prev_word = w[4*(i-Nk) : 4*(i-Nk) + 4]
            new_word = [t ^ p for t, p in zip(temp, prev_word)]
            w.extend(new_word)
            i += 1
            
        return [w[i:i+16] for i in range(0, len(w), 16)]

    def _rot_word(self, word):
        return word[1:] + word[:1]

    # --- FUNGSI ENKRIPSI ---

    def _sub_bytes(self, state):
        for r in range(4):
            for c in range(4):
                state[r][c] = self.sbox[state[r][c]]
        return state

    def _shift_rows(self, state):
        state[1] = state[1][1:] + state[1][:1]
        state[2] = state[2][2:] + state[2][:2]
        state[3] = state[3][3:] + state[3][:3]
        return state

    def _mix_columns(self, state):
        for c in range(4):
            col = [state[r][c] for r in range(4)]
            new_col = [
                gmul(0x02, col[0]) ^ gmul(0x03, col[1]) ^ col[2] ^ col[3],
                col[0] ^ gmul(0x02, col[1]) ^ gmul(0x03, col[2]) ^ col[3],
                col[0] ^ col[1] ^ gmul(0x02, col[2]) ^ gmul(0x03, col[3]),
                gmul(0x03, col[0]) ^ col[1] ^ col[2] ^ gmul(0x02, col[3])
            ]
            for r in range(4):
                state[r][c] = new_col[r]
        return state

    def _add_round_key(self, state, round_key):
        key_matrix = [[0]*4 for _ in range(4)]
        idx = 0
        for c in range(4):
            for r in range(4):
                key_matrix[r][c] = round_key[idx]
                idx += 1

        for r in range(4):
            for c in range(4):
                state[r][c] ^= key_matrix[r][c]
        return state

    def encrypt_block(self, plaintext):
        if len(plaintext) != 16: raise ValueError("Plaintext harus 16 bytes")
        
        # Convert ke state matrix (Column-Major)
        state = [[0]*4 for _ in range(4)]
        for c in range(4):
            for r in range(4):
                state[r][c] = plaintext[r + 4*c]

        state = self._add_round_key(state, self.round_keys[0])

        for round in range(1, 10):
            state = self._sub_bytes(state)
            state = self._shift_rows(state)
            state = self._mix_columns(state)
            state = self._add_round_key(state, self.round_keys[round])

        state = self._sub_bytes(state)
        state = self._shift_rows(state)
        state = self._add_round_key(state, self.round_keys[10])

        # Convert balik ke flat bytes
        ciphertext = []
        for c in range(4):
            for r in range(4):
                ciphertext.append(state[r][c])
        return bytes(ciphertext)

    # --- FUNGSI DEKRIPSI (BARU) ---

    def _inv_sub_bytes(self, state):
        for r in range(4):
            for c in range(4):
                state[r][c] = self.inv_sbox[state[r][c]]
        return state

    def _inv_shift_rows(self, state):
        # Geser kanan (Right Shift)
        state[1] = state[1][-1:] + state[1][:-1]
        state[2] = state[2][-2:] + state[2][:-2]
        state[3] = state[3][-3:] + state[3][:-3]
        return state

    def _inv_mix_columns(self, state):
        for c in range(4):
            col = [state[r][c] for r in range(4)]
            new_col = [
                gmul(0x0e, col[0]) ^ gmul(0x0b, col[1]) ^ gmul(0x0d, col[2]) ^ gmul(0x09, col[3]),
                gmul(0x09, col[0]) ^ gmul(0x0e, col[1]) ^ gmul(0x0b, col[2]) ^ gmul(0x0d, col[3]),
                gmul(0x0d, col[0]) ^ gmul(0x09, col[1]) ^ gmul(0x0e, col[2]) ^ gmul(0x0b, col[3]),
                gmul(0x0b, col[0]) ^ gmul(0x0d, col[1]) ^ gmul(0x09, col[2]) ^ gmul(0x0e, col[3])
            ]
            for r in range(4):
                state[r][c] = new_col[r]
        return state

    def decrypt_block(self, ciphertext):
        if len(ciphertext) != 16: raise ValueError("Ciphertext harus 16 bytes")

        state = [[0]*4 for _ in range(4)]
        for c in range(4):
            for r in range(4):
                state[r][c] = ciphertext[r + 4*c]

        # Urutan Dekripsi: Round 10 Mundur ke 0
        state = self._add_round_key(state, self.round_keys[10])
        state = self._inv_shift_rows(state)
        state = self._inv_sub_bytes(state)

        for round in range(9, 0, -1):
            state = self._add_round_key(state, self.round_keys[round])
            state = self._inv_mix_columns(state)
            state = self._inv_shift_rows(state)
            state = self._inv_sub_bytes(state)

        state = self._add_round_key(state, self.round_keys[0])

        plaintext = []
        for c in range(4):
            for r in range(4):
                plaintext.append(state[r][c])
        
        return bytes(plaintext)
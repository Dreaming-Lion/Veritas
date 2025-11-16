package com.veritas.backend.service;

import com.veritas.backend.config.JwtTokenProvider;
import com.veritas.backend.dto.auth.*;
import com.veritas.backend.entity.User;
import com.veritas.backend.exception.ApiException;
import com.veritas.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public UserResponse signup(SignupRequest req) {
        String nickname = req.getName();
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : null;
        String pw = req.getPassword();
        String pw2 = req.getPasswordConfirm();

        if (email == null || nickname == null || pw == null || pw2 == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "모든 필드를 입력해주세요.");
        }
        if (pw.length() < 6) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "비밀번호는 6자 이상이어야 합니다.");
        }
        if (pw2.length() < 6) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "비밀번호 확인은 6자 이상이어야 합니다.");
        }
        if (!pw.equals(pw2)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "비밀번호가 일치하지 않습니다.");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "이미 사용 중인 이메일입니다.");
        }

        String hash = passwordEncoder.encode(pw);

        User user = new User(nickname, email, hash);
        userRepository.save(user);

        return new UserResponse(user.getId(), user.getNickname(), user.getEmail(), user.getCreatedAt());
    }

    public TokenResponse login(LoginRequest req) {
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : null;
        String pw = req.getPassword();

        if (email == null || pw == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "이메일과 비밀번호를 입력해주세요.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(pw, user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        return new TokenResponse(token);
    }

    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        return new UserResponse(user.getId(), user.getNickname(), user.getEmail(), user.getCreatedAt());
    }
}

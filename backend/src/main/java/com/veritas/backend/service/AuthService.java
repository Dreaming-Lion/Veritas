package com.veritas.backend.service;

import com.veritas.backend.config.JwtTokenProvider;
import com.veritas.backend.dto.auth.LoginRequest;
import com.veritas.backend.dto.auth.SignupRequest;
import com.veritas.backend.dto.auth.TokenResponse;
import com.veritas.backend.dto.auth.UserResponse;
import com.veritas.backend.entity.User;
import com.veritas.backend.exception.ApiException;
import com.veritas.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public void signup(SignupRequest request) {
        if (request.getName() == null ||
            request.getEmail() == null ||
            request.getPassword() == null ||
            request.getPasswordConfirm() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "모든 필드를 입력해주세요.");
        }

        if (!request.getPassword().equals(request.getPasswordConfirm())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "비밀번호가 일치하지 않습니다.");
        }

        String email = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "이미 사용 중인 이메일입니다.");
        }

        String nickname = request.getName().trim();
        String passwordHash = passwordEncoder.encode(request.getPassword());

        User user = User.create(nickname, email, passwordHash);
        userRepository.save(user);
    }

    public TokenResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "모든 필드를 입력해주세요.");
        }

        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.")
                );

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = jwtTokenProvider.createAccessToken(
                user.getId(),
                user.getEmail(),
                user.getNickname()
        );

        return new TokenResponse(token, "bearer");
    }

    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.")
                );

        return new UserResponse(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.getCreatedAt()
        );
    }
}

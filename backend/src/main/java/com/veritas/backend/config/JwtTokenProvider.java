package com.veritas.backend.config;

import com.veritas.backend.domain.auth.UserPrincipal;  
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expire-minutes:1440}")
    private long accessTokenExpireMinutes;

    private SecretKey key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(Long userId, String email) {
        return createToken(userId, email);
    }

    public String createToken(Long userId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpireMinutes * 60_000L);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Jws<Claims> parseToken(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
    }

    public Long getUserId(String token) {
        Claims claims = parseToken(token).getPayload();
        return Long.parseLong(claims.getSubject());
    }

    public String getEmail(String token) {
        Claims claims = parseToken(token).getPayload();
        return claims.get("email", String.class);
    }

    public UserPrincipal toPrincipal(String token) {
        try {
            Long userId = getUserId(token);
            String email = getEmail(token);
            return new UserPrincipal(userId, email);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}

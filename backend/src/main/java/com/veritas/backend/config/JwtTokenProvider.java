package com.veritas.backend.config;

import com.veritas.backend.domain.auth.UserPrincipal;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expire-minutes:1440}")
    private long accessTokenExpireMinutes;

    private Key key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(Long userId, String email, String nickname) {
        Instant now = Instant.now();
        Instant expiry = now.plus(accessTokenExpireMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiry))
                .claim("email", email)
                .claim("nickname", nickname)  
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parseToken(String token) throws JwtException {
        return Jwts.parser()
                .setSigningKey(key)
                .build()
                .parseSignedClaims(token);
    }

    public UserPrincipal toPrincipal(String token) throws JwtException {
        Jws<Claims> jws = parseToken(token);
        Claims claims = jws.getBody();

        Long userId = Long.parseLong(claims.getSubject());
        String email = claims.get("email", String.class);

        return new UserPrincipal(userId, email);
    }
}

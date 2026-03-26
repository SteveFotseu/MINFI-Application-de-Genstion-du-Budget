package gov.cmr.minfi.db.gbe.app.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Date;
import java.util.Map;

@Service
@Getter
@Setter
public class JwtService {

    private static final String TOKEN_TYPE = "token_type";
    private static final String MFA_TOKEN_TYPE = "MFA_TOKEN";
    private final PrivateKey privateKey;
    private final PublicKey publicKey;

    @Value("${app.security.jwt.access-token-expiration}")
    private long accesTokenExpiration;

    @Value("${app.security.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;


    @Value("${app.security.jwt.mfa-token-expiration}")
    private long mfaTokenExpiration;


    public JwtService() throws Exception {
        this.privateKey = KeyUtils.loadPrivateKey("/keys/local-only/private_key.pem");
        this.publicKey = KeyUtils.loadPublicKey("/keys/local-only/public_key.pem");
    }

    public String generateAccessToken(final String username) {
        final Map<String, Object> claims = Map.of(TOKEN_TYPE, "ACCES_TOKEN");
        return buildToken(username, claims, this.accesTokenExpiration);
    }

    public String generateRefreshToken(final String username) {
        final Map<String, Object> claims = Map.of(TOKEN_TYPE, "REFRESH_TOKEN");
        return buildToken(username, claims, this.refreshTokenExpiration);
    }

    private String buildToken(final String username, final Map<String, Object> claims, long expiration) {
        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(this.privateKey)
                .compact();
    }

    public boolean isTokenValid(final String token, final String expectedUsername) {
        final String username = extractUsername(token);
        return username.equals(expectedUsername) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    private Claims extractClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(this.publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (final JwtException e) {
            throw new RuntimeException("Invalid JWT token", e);
        }
    }

    public String refreshAccessToken(final String refreshToken) {
        final Claims claims = extractClaims(refreshToken);
        if (!"REFRESH_TOKEN".equals(claims.get(TOKEN_TYPE))) {
            throw new RuntimeException("Invalid  token type");
        }

        if (isTokenExpired(refreshToken)) {
            throw new RuntimeException("Refresh Token  expired");
        }
        final String username = claims.getSubject();

        return generateAccessToken(username);
    }

    public String generateMfaToken(final String username) {
        final Map<String, Object> claims = Map.of(TOKEN_TYPE, MFA_TOKEN_TYPE);
        return buildToken(username, claims, this.mfaTokenExpiration);
    }

    public void validateMfaToken(final String token) {
        final Claims claims = extractClaims(token);
        if (!MFA_TOKEN_TYPE.equals(claims.get(TOKEN_TYPE))) {
            throw new RuntimeException("Invalid  token type - MFA token required");

        }

        if (isTokenExpired(token)) {
            throw new RuntimeException("MFA Token  expired");
        }
    }

    public String extractUsernameFromMfaToken(final String token) {
        validateMfaToken(token);

        return extractUsername(token);
    }


}























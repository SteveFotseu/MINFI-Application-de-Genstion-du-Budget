package gov.cmr.minfi.db.gbe.app.common.config;

import gov.cmr.minfi.db.gbe.app.common.audit.ApplicatorAuditoreAware;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class BeansConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(final AuthenticationConfiguration config) {
        return config.getAuthenticationManager();
    }


    @Bean
    public CorsFilter corsFilter() {
        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        final CorsConfiguration config = new CorsConfiguration();

        // 1. Autoriser les origines spécifiques (Frontend, Swagger, etc.)
        config.setAllowedOrigins(List.of("http://localhost:3000", "https://minfi-application-de-genstion-du-bu.vercel.app/"));

        // 2. Autoriser les headers
        config.setAllowedHeaders(Arrays.asList(
                "Origin",
                "Content-Type",
                "Accept",
                "Authorization",
                "Access-Control-Allow-Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers",
                "X-Requested-With"
        ));

        // 3. Exposer les headers (utile pour que le front lise certains headers de réponse)
        config.setExposedHeaders(Arrays.asList(
                "Origin",
                "Content-Type",
                "Accept",
                "Authorization",
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials",
                "Content-Disposition" // Utile pour les téléchargements de fichiers
        ));

        // 4. Autoriser les méthodes HTTP
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));


        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // Cache la réponse preflight pendant 1h (3600s)

        // Appliquer cette configuration à toutes les routes
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }

    @Bean
    public AuditorAware<String> auditorAware() {
        return new ApplicatorAuditoreAware();
    }
}


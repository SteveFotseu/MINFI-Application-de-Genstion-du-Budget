package gov.cmr.minfi.db.gbe.app.common.config;


import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;

@OpenAPIDefinition(
        info = @Info(
                contact = @Contact(
                        name = "DGB",
                        email = "dge.cellule.informatique"
                ),
                description = "OpenApi documentation for gbe",
                version = "1.0",
                license = @License(
                        name = "Proprietaire"
                ),
                termsOfService = "ras"

        ),
        servers = {
                @Server(
                        url = "https://gbe-8clf.onrender.com",
                        description = "Production server"
                ),
                @Server(
                        url = "http://localhost:8080",
                        description = "Development server"
                )
        },
        security = {
                @SecurityRequirement(
                        name = "bearerAuth"
                )
        }

)
@SecurityScheme(
        name = "bearerAuth",
        description = "JWT auth description",
        scheme = "bearer",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}

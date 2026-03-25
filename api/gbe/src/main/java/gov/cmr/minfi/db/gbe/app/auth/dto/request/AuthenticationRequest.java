package gov.cmr.minfi.db.gbe.app.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AuthenticationRequest(
        @NotBlank(message = "VALIDATION.AUTHENTICATION.EMAIL.NOT_BLANK")
        @Email(message = "VALIDATION.AUTHENTICATION.EMAIL.FORMAT")
        @Schema(example = "ordor@gmail.com")
        String email,
        @NotBlank(message = "VALIDATION.AUTHENTICATION.PASSWORD.NOT_BLANK")
        @Schema(example = "<PASSWORD>")
        String password

) {
}

package gov.cmr.minfi.db.gbe.app.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record SetupMfaRequest(
        @NotBlank(message = "VALIDATION.SETUP_MFA.EMAIL.NOT_BLANK")
        @Email(message = "VALIDATION.SETUP_MFA.EMAIL.FORMAT")
        @Schema(example = "mon.nom@email.cm")
        String email,

        @NotBlank(message = "VALIDATION.SETUP_MFA.CODE.NOT_BLANK")
        @Size(min = 6, max = 6, message = "VALIDATION.SETUP_MFA.CODE.SIZE")
        @Schema(example = "123456")
        String code,
        @NotBlank(message = "VALIDATION.SETUP_MFA.TOKEN.NOT_BLANK")
        @Schema(example = "eyJhbGciOiJSUzI1NiJ9...")
        String mfaToken
) {
}

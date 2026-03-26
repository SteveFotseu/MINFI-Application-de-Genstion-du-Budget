package gov.cmr.minfi.db.gbe.app.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record VerificationRequest(
        @NotBlank(message = "VALIDATION.VERIFY.EMAIL.NOT_BLANK")
        String email,

        @NotBlank(message = "VALIDATION.VERIFY.CODE.NOT_BLANK")
        String code,

        @NotBlank(message = "VALIDATION.VERIFY.TOKEN.NOT_BLANK")
        String mfaToken
) {
}
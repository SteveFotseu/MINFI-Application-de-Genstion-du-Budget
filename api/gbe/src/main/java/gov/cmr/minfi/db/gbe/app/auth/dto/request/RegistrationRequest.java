package gov.cmr.minfi.db.gbe.app.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistrationRequest(
        @NotBlank(message = "VALIDATION.REGISTRATION.FIRSTNAME.NOT_BLANK")
        @Size(
                min = 1,
                max = 50,
                message = "VALIDATION.REGISTRATION.FIRSTNAME.SIZE"
        )
        @Schema(example = "Ali")
        String firstName,
        @NotBlank(message = "VALIDATION.REGISTRATION.LASTNAME.NOT_BLANK")
        @Size(
                min = 1,
                max = 50,
                message = "VALIDATION.REGISTRATION.LASTNAME.SIZE"
        )
        @Schema(example = "Ali")
        String lastName,
        @NotBlank(message = "VALIDATION.REGISTRATION.EMAIL.NOT_BLANK")
        @Email(message = "VALIDATION.REGISTRATION.EMAIL.FORMAT")
        // @NonDisposableEmail(message = "VALIDATION.REGISTRATION.EMAIL.DISPOSABLE")
        @Schema(example = "email@example.test")
        String email,
        @NotBlank(message = "VALIDATION.REGISTRATION.PASSWORD.NOT_BLANK")
        @Size(
                min = 8,
                max = 72,
                message = "VALIDATION.REGISTRATION.PASSWORD.SIZE"
        )
        @Pattern(
                regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*\\W).*$",
                message = " VALIDATION.REGISTRATION.CONFIRM_PASSWORD.WEAK"
        )
        @Schema(example = "P@ssw0rd")
        String password,
        @Pattern(
                regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*\\W).*$",
                message = " VALIDATION.REGISTRATION.CONFIRM_PASSWORD.WEAK"
        )
        @Schema(example = "minfi@email.com")
        String confirmPassword,
        @Pattern(
                regexp = "^\\+?[0-9]{9,13}",
                message = " VALIDATION.REGISTRATION.PHONE.FORMAT"
        )
        @Schema(example = "+237655555555")
        String phoneNumber,
        String dateOfBirth,
        boolean mfaEnabled

) {
}

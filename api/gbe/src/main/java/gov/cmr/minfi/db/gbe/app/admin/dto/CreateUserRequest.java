package gov.cmr.minfi.db.gbe.app.admin.dto;

import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public record CreateUserRequest(

        @NotBlank(message = "VALIDATION.USER.FIRSTNAME.NOT_BLANK")
        @Size(min = 1, max = 50, message = "VALIDATION.USER.FIRSTNAME.SIZE")
        @Schema(example = "Mbarga")
        String firstName,

        @NotBlank(message = "VALIDATION.USER.LASTNAME.NOT_BLANK")
        @Size(min = 1, max = 50, message = "VALIDATION.USER.LASTNAME.SIZE")
        @Schema(example = "Paul")
        String lastName,

        @NotBlank(message = "VALIDATION.USER.MATRICULE.NOT_BLANK")
        @Size(min = 9, max = 9, message = "VALIDATION.USER.MATRICULE.SIZE")
        @Schema(example = "1000000A")
        String matricule,

        @NotBlank(message = "VALIDATION.USER.EMAIL.NOT_BLANK")
        @Email(message = "VALIDATION.USER.EMAIL.FORMAT")
        @Schema(example = "monemail@gest.cm")
        String email,

        @Pattern(
                regexp = "^\\+?[0-9]{9,13}",
                message = "VALIDATION.USER.PHONE_NUMBER.FORMAT"
        )
        @Schema(example = "+2376555555")
        String phoneNumber,

        @NotBlank(message = "VALIDATION.USER.CNI_NUMBER.NOT_BLANK")
        String numeroCni,

        @NotBlank(message = "VALIDATION.USER.NUI.NOT_BLANK")
        String nui,

        @NotNull(message = "VALIDATION.USER.CNI.ISSUE.DATE.NOT_NULL")
        LocalDate cniIssueDate,

        @NotNull(message = "VALIDATION.USER.CNI.EXPIRY.DATE.NOT_NULL")
        LocalDate cniExpiryDate,

        @NotNull(message = "VALIDATION.USER.ROLE.NOT_NULL")
        RoleSysteme roleSysteme,

        @NotBlank(message = "VALIDATION.USER.SECTION.NOT_BLANK")
        @Schema(example = "uuid-de-la-section")
        String sectionId,

        @NotEmpty(message = "VALIDATION.USER.PROGRAMMES.NOT_EMPTY")
        @Schema(description = "Liste des IDs de programmes")
        List<String> programmeIds,

        @NotBlank(message = "VALIDATION.USER.PASSWORD.NOT_BLANK")
        @Size(min = 8, max = 72, message = "VALIDATION.USER.PASSWORD.SIZE")
        @Pattern(
                regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*\\W).*$",
                message = "VALIDATION.USER.PASSWORD.WEAK"
        )
        @Schema(example = "Temp@1234")
        String password

) {
}
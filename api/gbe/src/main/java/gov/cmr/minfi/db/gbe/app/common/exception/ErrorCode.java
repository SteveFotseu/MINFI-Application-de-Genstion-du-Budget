package gov.cmr.minfi.db.gbe.app.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import static org.springframework.http.HttpStatus.*;

@Getter
public enum ErrorCode {
    USER_NOT_FOUND("USER_NOT_FOUND", "User not found with id %s", NOT_FOUND),
    CHANGE_PASSWORD_MISMATCH("CHANGE_PASSWORD_MISMATCH", "The new password and his confirmed are differents", BAD_REQUEST),
    INVALID_CURRENT_PASSWORD("INVALID_CURRENT_PASSWORD", "The current password is invalid", BAD_REQUEST),
    ACCOUNT_ALREADY_DEACTIVATED("ACCOUNT_ALREADY_DEACTIVATED", "The account is already deactivated", BAD_REQUEST),
    EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", "Email already exists", BAD_REQUEST),
    PHONE_NUMBER_ALREADY_EXISTS("PHONE_NUMBER_ALREADY_EXISTS", "Phone number already exists", BAD_REQUEST),
    PASSWORD_MISMATCH("PASSWORD_MISMATCH", "passwords does not match", BAD_REQUEST),
    ERR_USER_DISABLED("ERR_USER_DISABLED", "user is disabled", UNAUTHORIZED),
    BAD_CREDENTIALS("BAD_CREDENTIALS", "Bad credentials", UNAUTHORIZED),
    USERNAME_NOT_FOUND("USERNAME_NOT_FOUND", "User not found with username %s", NOT_FOUND),
    INTERNAL_EXCEPTION("INTERNAL_EXCEPTION", "Internal exception", INTERNAL_SERVER_ERROR),
    ENTITY_NOT_FOUND("ENTITY_NOT_FOUND", "Entity not found with id %s", NOT_FOUND),
    METHODE_ARGUMENT_NOT_VALID("METHODE_ARGUMENT_NOT_VALID", "Method argument not valid", BAD_REQUEST),
    NUI_ALREADY_EXISTS("NUI_ALREADY_EXISTS", "this nui is already use", BAD_REQUEST),
    CNI_ALREADY_EXISTS("CNI_ALREADY_EXISTS", "this cni is already use", BAD_REQUEST),
    ACCOUNT_ALREADY_ACTIVATED("ACCOUNT_ALREADY_ACTIVATED", "this account is already activated", BAD_REQUEST),
    MATRICULE_ALREADY_EXISTS("MATRICULE_ALREADY_EXISTS", "this matricule is already use", BAD_REQUEST),
    MFA_ALREADY_CONFIRMED("MFA_ALREADY_CONFIRMED", "mfa is already confirmed for this user", BAD_REQUEST),
    AFFECTATION_ALREADY_EXISTS("AFFECTATION_ALREADY_EXISTS", "Affectation already exists for this user and programme", BAD_REQUEST),
    AFFECTATION_ALREADY_ACTIVE("AFFECTATION_ALREADY_ACTIVE", "Affectation is already active", BAD_REQUEST),
    AFFECTATION_ALREADY_INACTIVE("AFFECTATION_ALREADY_INACTIVE", "Affectation is already inactive", BAD_REQUEST),
    AFFECTATION_NOT_FOUND("AFFECTATION_NOT_FOUND", "Affectation not found for this user", NOT_FOUND);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;

    ErrorCode(final String code, final String defaultMessage, final HttpStatus httpStatus) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.httpStatus = httpStatus;
    }


}

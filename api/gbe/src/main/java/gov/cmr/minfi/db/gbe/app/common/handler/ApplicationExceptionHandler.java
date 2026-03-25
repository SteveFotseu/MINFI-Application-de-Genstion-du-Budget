package gov.cmr.minfi.db.gbe.app.common.handler;

import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;

import static gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode.BAD_CREDENTIALS;
import static gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode.ERR_USER_DISABLED;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class ApplicationExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
        final ErrorResponse body = ErrorResponse.builder()
                .code(ex.getErrorCode().getCode())
                .message(ex.getMessage())
                .build();

        log.info("Business exception  {}", ex.getMessage());
        log.debug(ex.getMessage(), ex);

        return ResponseEntity.status(
                ex.getErrorCode().getHttpStatus() != null ? ex.getErrorCode().getHttpStatus() : BAD_REQUEST
        ).body(body);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErrorResponse> handleDisabledException(DisabledException ex) {
        final ErrorResponse body = ErrorResponse.builder()
                .code(ERR_USER_DISABLED.getCode())
                .message(ERR_USER_DISABLED.getDefaultMessage())
                .build();
        return ResponseEntity.status(ERR_USER_DISABLED.getHttpStatus()).body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(BadCredentialsException ex) {
        log.debug(ex.getMessage(), ex);
        final ErrorResponse body = ErrorResponse.builder()
                .message(BAD_CREDENTIALS.getDefaultMessage())
                .code(BAD_CREDENTIALS.getCode())
                .build();
        return ResponseEntity.status(BAD_CREDENTIALS.getHttpStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        log.debug(ex.getMessage(), ex);

        final List<ErrorResponse.ValidationError> errors = new ArrayList<>();
        ex.getBindingResult()
                .getAllErrors()
                .forEach(
                        error -> {
                            final String fieldName = ((FieldError) error).getField();
                            final String errorCode = error.getDefaultMessage();

                            errors.add(ErrorResponse.ValidationError.builder()
                                    .field(fieldName)
                                    .code(errorCode)
                                    .message(errorCode)
                                    .build()
                            );
                        });
        final ErrorResponse errorResponse = ErrorResponse.builder()
                .validationsErros(errors)
                .build();
        return ResponseEntity.status(BAD_REQUEST)
                .body(errorResponse);

    }

//    @ExceptionHandler(EntityNotFoundException.class)
//    public ResponseEntity<ErrorResponse> handleEntityNotFoundException(EntityNotFoundException ex) {
//        log.debug(ex.getMessage(), ex);
//        final ErrorResponse body = ErrorResponse.builder()
//                .message(ENTITY_NOT_FOUND.getDefaultMessage())
//                .code(ENTITY_NOT_FOUND.getCode())
//                .build();
//        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
//    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUsernameNotFoundException(UsernameNotFoundException ex) {
        log.debug(ex.getMessage(), ex);
        final ErrorResponse body = ErrorResponse.builder()
                .message(ErrorCode.USERNAME_NOT_FOUND.getDefaultMessage())
                .code(ErrorCode.USERNAME_NOT_FOUND.getCode())
                .build();
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        log.error(ex.getMessage(), ex);
        final ErrorResponse response = ErrorResponse.builder()
                .code(ErrorCode.INTERNAL_EXCEPTION.getCode())
                .message(ex.getMessage())
                .build();

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

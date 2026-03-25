package gov.cmr.minfi.db.gbe.app.auth.dto.request;

import lombok.Builder;

@Builder
public record VerificationRequest(String email, String code) {
}

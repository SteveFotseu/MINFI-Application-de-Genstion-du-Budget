package gov.cmr.minfi.db.gbe.app.affectation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAffectationRepository extends JpaRepository<UserAffectation, String> {
    List<UserAffectation> findByUserId(String userId);

    List<UserAffectation> findByUserIdAndActifTrue(String userId);

    boolean existsByUserIdAndProgrammeId(String userId, String programmeId);

    void deleteByUserIdAndProgrammeId(String userId, String programmeId);
}

package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SectionRepository extends JpaRepository<Section, String> {
    boolean existsByCodeSectionAndExerciceId(String codeSection, String exerciceId);
}

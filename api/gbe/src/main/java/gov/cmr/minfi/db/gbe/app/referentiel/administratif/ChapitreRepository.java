package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChapitreRepository extends JpaRepository<Chapitre, String> {
    List<Chapitre> findBySectionId(String sectionId);
}
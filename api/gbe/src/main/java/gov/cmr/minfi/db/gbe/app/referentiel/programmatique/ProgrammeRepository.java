package gov.cmr.minfi.db.gbe.app.referentiel.programmatique;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProgrammeRepository extends JpaRepository<Programme, String> {
    List<Programme> findBySectionId(String sectionId);

    List<Programme> findBySectionIdAndActifTrue(String sectionId);
}

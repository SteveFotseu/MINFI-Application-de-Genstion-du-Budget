package gov.cmr.minfi.db.gbe.app.referentiel.programmatique;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActionRepository extends JpaRepository<Action, String> {
    List<Action> findByProgrammeId(String programmeId);

    List<Action> findByExerciceId(String exerciceId);
}
package gov.cmr.minfi.db.gbe.app.exercice;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciceRepository extends JpaRepository<Exercice, String> {

    boolean existsByAnnee(Integer annee);
}
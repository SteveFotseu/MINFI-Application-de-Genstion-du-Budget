package gov.cmr.minfi.db.gbe.app.exercice;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "EXERCICE")
public class Exercice extends BaseEntity {

    @Column(name = "ANNEE", nullable = false, unique = true)
    private Integer annee;

    @Column(name = "CODE_EXERCICE", nullable = false)
    private Integer codeExercice;

    @Column(name = "LIBELLE_FR")
    private String libelleFr;

    @Column(name = "LIBELLE_EN")
    private String libelleEn;

    @Column(name = "ACTIF")
    private boolean actif;

    @PrePersist
    @PreUpdate
    private void calculerCode() {
        if (this.annee != null) {
            this.codeExercice = 47 + (this.annee - 2013);
        }
    }
}
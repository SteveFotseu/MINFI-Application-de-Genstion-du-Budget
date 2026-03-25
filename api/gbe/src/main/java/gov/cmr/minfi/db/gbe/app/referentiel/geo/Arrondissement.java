package gov.cmr.minfi.db.gbe.app.referentiel.geo;

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
@Table(name = "ARRONDISSEMENT")
public class Arrondissement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTEMENT_ID", nullable = false)
    private Departement departement;

    @Column(name = "CODE_ARRONDISSEMENT", nullable = false, length = 1)
    private String codeArrondissement;

    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 4)
    private String codeComplet;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.departement != null && this.codeArrondissement != null) {
            this.codeComplet = this.departement.getCodeComplet()
                    + this.codeArrondissement;
        }
    }
}
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
@Table(name = "DEPARTEMENT")
public class Departement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "REGION_ID", nullable = false)
    private Region region;

    @Column(name = "CODE_DEPARTEMENT", nullable = false, length = 1)
    private String codeDepartement;

    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 3)
    private String codeComplet;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.region != null && this.codeDepartement != null) {
            this.codeComplet = this.region.getCodeRegion() + this.codeDepartement;
        }
    }
}
package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.referentiel.geo.Arrondissement;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "CHAPITRE")
public class Chapitre extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SECTION_ID", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CATEGORIE_SERVICE_ID", nullable = false)
    private CategorieService categorieService;

    // Nullable — services centraux n'ont pas de localisation géographique
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ARRONDISSEMENT_ID")
    private Arrondissement arrondissement;

    // Numéro d'ordre sur 2 caractères — ex: "01", "02"
    @Column(name = "NUM_ORDRE", nullable = false, length = 2)
    private String numOrdre;

    // Code complet 8 car = codeService(2) + codeGeo(4) + numOrdre(2)
    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 8)
    private String codeComplet;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.categorieService == null || this.numOrdre == null) return;

        String codeService = this.categorieService.getCode();

        // Services centraux → codeGeo = "0000"
        String codeGeo = (this.arrondissement != null)
                ? this.arrondissement.getCodeComplet()
                : "0000";

        this.codeComplet = codeService + codeGeo + this.numOrdre;
    }
}
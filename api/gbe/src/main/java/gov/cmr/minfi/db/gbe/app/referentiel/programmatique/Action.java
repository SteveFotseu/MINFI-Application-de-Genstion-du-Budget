package gov.cmr.minfi.db.gbe.app.referentiel.programmatique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.exercice.Exercice;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "ACTION")
public class Action extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROGRAMME_ID", nullable = false)
    private Programme programme;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EXERCICE_ID", nullable = false)
    private Exercice exercice;

    // 2 caractères dans la pratique — ex: "01", "02"... "09"
    @Column(name = "CODE_ACTION", nullable = false, length = 2)
    private String codeAction;

    // Code composite — ex: "58.112.01"
    @Column(name = "AUTRE_CODE", length = 50)
    private String autreCode;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN")
    private String libelleEn;
}
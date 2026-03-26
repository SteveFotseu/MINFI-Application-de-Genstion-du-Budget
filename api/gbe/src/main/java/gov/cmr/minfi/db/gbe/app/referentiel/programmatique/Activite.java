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
@Table(name = "ACTIVITE")
public class Activite extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ACTION_ID", nullable = false)
    private Action action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EXERCICE_ID", nullable = false)
    private Exercice exercice;

    @Column(name = "CODE_ACTIVITE", nullable = false)
    private String codeActivite;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN")
    private String libelleEn;
}
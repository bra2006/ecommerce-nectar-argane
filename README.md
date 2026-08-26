        # Nectar d'Argane

        Site de démonstration réalisé par **AEXT Studio** — formule **E-COMMERCE**.

        > Cosmétique bio à l'huile d'argan pressée à froid, produite par une coopérative de femmes près d'Essaouira.

        ---

        ## Structure

        ```
        ecommerce-nectar-argane/
        ├── index.html            page d'accueil
        ├── …                     autres pages (voir tableau)
        ├── 404.html              page d'erreur
        ├── assets/
        │   ├── css/base.css      socle structurel (aucune couleur en dur)
        │   ├── css/theme.css     identité visuelle du site (tokens + composants)
        │   ├── js/main.js        navigation, thème, formulaires, animations
        │   ├── js/hero.js        animation générative de la bannière
        │   └── img/              favicon, logo, image de partage
        ├── sitemap.xml
        ├── robots.txt
        ├── site.webmanifest
        ├── netlify.toml
        └── _redirects
        ```

        ## Pages

        | Fichier | Page |
        |---|---|
        | `index.html` | Nectar d'Argane — Cosmétique bio à l'huile d'argan |
| `boutique.html` | Boutique |
| `produit-huile-argan.html` | Huile d'argan cosmétique 100 ml |
| `produit-savon-noir.html` | Savon noir traditionnel 200 g |
| `produit-baume-corps.html` | Baume corps argan & fleur d'oranger 150 ml |
| `produit-coffret.html` | Coffret rituel Nectar |
| `collections.html` | Collections capsules |
| `histoire.html` | Notre histoire |
| `panier.html` | Panier |
| `contact.html` | Contact |

        ## Mise en ligne

        Le site est **100 % statique** : aucune étape de build, aucune dépendance à installer.

        **Netlify / Vercel / Cloudflare Pages** — glisser-déposer le dossier, ou connecter le dépôt Git.
        Répertoire de publication : la racine du dossier.

        **Hébergement classique (cPanel, FTP)** — téléverser le contenu du dossier dans `public_html/`.

        **Aperçu en local**
        ```bash
        python3 -m http.server 8000
        # puis ouvrir http://localhost:8000
        ```

        ## Activer les formulaires

        Les formulaires sont validés côté client et prêts à être branchés, sans serveur à gérer.

        **Option A — Formspree** : créer un formulaire sur formspree.io, puis renseigner l'action :
        ```html
        <form data-form action="https://formspree.io/f/VOTRE_ID" method="post">
        ```

        **Option B — Netlify Forms** : ajouter l'attribut `netlify` et laisser l'action vide :
        ```html
        <form data-form netlify name="contact">
        ```

        Sans action renseignée, le formulaire affiche un message de confirmation de démonstration.
        Un champ leurre anti-robots (`.honeypot`) est déjà en place.

        ## Avant la mise en production

        - [ ] Remplacer `nectardargane.ma` par le domaine réel (balises `canonical`, `og:url`, `sitemap.xml`, `robots.txt`)
        - [ ] Remplacer les visuels générés par les photos du client
        - [ ] Renseigner les vraies coordonnées (bonjour@nectardargane.ma, +212 6 00 00 00 00)
        - [ ] Brancher les formulaires (voir ci-dessus)
        - [ ] Ajouter la mesure d'audience si souhaitée (Plausible, Matomo, GA4)
        - [ ] Soumettre `sitemap.xml` dans Google Search Console

        ## Accessibilité et performance

        - Structure sémantique, points de repère ARIA, lien d'évitement
        - Navigation clavier complète, focus visible sur tous les éléments interactifs
        - Thème clair / sombre respectant le réglage système, avec bascule manuelle
        - `prefers-reduced-motion` respecté (animations neutralisées)
        - Aucune dépendance externe hormis Google Fonts
        - Images vectorielles, animations en `<canvas>` — pas de fichier lourd à charger

        ---

        AEXT Studio · bonjour@nectardargane.ma · +212 6 00 00 00 00 · Casablanca, Maroc

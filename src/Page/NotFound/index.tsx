import { Link } from 'react-router-dom'
import './NotFound.css'

const NotFound: React.FC = () => {
  return (
    <div className={'container'}>
      <div className={'content'}>
        <div className='image'>
          <h1 className={'errorCode'}>404</h1>
          <h2 className={'errorMessage'}>Page Introuvable</h2>
        </div>
        <div className={'explanation'}>
          <h3>Pourquoi une page introuvable est une page 404 ?</h3>
          <p>
            Dans les années 80, la base de données centrale des fichiers du World Wide Web (WWW) était située dans le bureau 404 d'un bâtiment en Suisse. Quand les développeurs faisaient une erreur dans le nommage des fichiers source, ils envoyaient une note aux techniciens du bureau avec le texte suivant "Room 404: File not found". C'est de là que viennent les pages 404.
          </p>
        </div>
        <Link className={'homeLink'} to="/">
          Retour à l'accueil
        </Link>
      </div>

    </div>
  )
}

export default NotFound
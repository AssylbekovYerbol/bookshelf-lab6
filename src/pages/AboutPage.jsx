import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

const ROUTES = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/books', 'Books list (search, filters, sorting, pagination in the URL)'],
  ['/books/:id', 'Book details'],
  ['/dashboard', 'Dashboard'],
  ['/login', 'Log in (email / password or Google)'],
  ['/signup', 'Sign up with validation'],
  ['/profile', 'Profile: email, UID, log out (protected)'],
  ['*', 'Not Found (404)'],
];

export default function AboutPage() {
  usePageTitle('About');
  return (
    <article className="prose">
      <h2>About this project</h2>
      <p>
        Bookshelf is a library catalogue built as a React single-page application. It started as a midterm project and
        grew with every homework: asynchronous effects with a simulated API, routing and application architecture, then
        server-data caching and Firebase Authentication.
      </p>

      <h3>What it can do</h3>
      <ul className="bullets">
        <li>Search by title, author or description; filter by genre, availability, rating and favourites; sort and paginate.</li>
        <li>Open a book, see ten details, change its availability, mark it as a favourite, edit or delete it.</li>
        <li>Add new books with a validated form.</li>
        <li>Dashboard with statistics and breakdowns that link back to the filtered catalogue.</li>
        <li>Sign up, log in (email / password or Google) and a protected profile page; the session survives a refresh.</li>
        <li>Cached server data: revisiting a page is instant and the cache is refreshed after every change.</li>
      </ul>

      <h3>Built with</h3>
      <ul className="bullets">
        <li>React 18 and Vite</li>
        <li>React Router (nested routes, dynamic URLs, useSearchParams, lazy loading with Suspense)</li>
        <li>A simulated asynchronous API (Promises, random delays, localStorage, AbortSignal)</li>
        <li>A custom query cache (query keys, stale-while-revalidate, invalidation) and Firebase Authentication</li>
      </ul>

      <h3>Routes</h3>
      <table className="routes-table">
        <thead>
          <tr>
            <th>Path</th>
            <th>Page</th>
          </tr>
        </thead>
        <tbody>
          {ROUTES.map(([path, page]) => (
            <tr key={path}>
              <td>
                <code>{path}</code>
              </td>
              <td>{page}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        <Link to="/books" className="btn">
          Explore the books
        </Link>
      </p>
    </article>
  );
}

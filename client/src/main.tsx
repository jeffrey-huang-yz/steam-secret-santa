import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from '@apollo/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const link = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql',
  credentials: 'include',
});

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>,
);

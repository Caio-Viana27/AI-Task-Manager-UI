import { RouterProvider } from 'react-router'
import { router } from './routes/router.tsx'

function App() {
  return <RouterProvider router={router} />
}

export default App

import { LottieSvg } from "lottie-react"
import loadingAnimation from "../Loading Animation Circle.json"

export default function LoadingScreen() {
  return (
    <main className="loading-screen" role="status" aria-live="polite">
      <div className="loading-animation" aria-hidden="true">
        <LottieSvg src={loadingAnimation} loop autoplay />
      </div>
      <p>Loading No Bluff</p>
    </main>
  )
}

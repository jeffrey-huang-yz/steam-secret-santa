"use client"

import { Gift, Users, Calendar, Sparkles } from "lucide-react"
import { Snowfall } from "@/components/snowfall"
import { InteractiveHoverButton } from "../../components/ui/interactive-hover-button"

export default function LoginPage() {
  const handleSteamLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/auth/steam`
  }

  return (
    <div className="login-page">
      <Snowfall />

      <div className="login-container">
        <div className="hero-section">
          <Gift className="hero-gift-icon gift-bounce animate-entrance" />
          <h1 className="main-title animate-entrance">Steam Secret Santa</h1>
          <p className="subtitle animate-entrance-delayed">
            Organize magical gift exchanges with your Steam friends. Create events, invite participants, and let the
            holiday spirit bring joy to your gaming community!
          </p>

          <div className="relative flex justify-center animate-entrance-button">
            <InteractiveHoverButton text="Steam Sign-In" onClick={handleSteamLogin} className="login-button" />
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card animate-entrance-stagger-1">
            <Users className="feature-icon green" />
            <h3 className="feature-title">Easy Group Management</h3>
            <p className="feature-description">
              Create events and invite your Steam friends with just a few clicks. Manage participants effortlessly.
            </p>
          </div>

          <div className="feature-card animate-entrance-stagger-2">
            <Sparkles className="feature-icon red" />
            <h3 className="feature-title">Smart Matching</h3>
            <p className="feature-description">
              Our algorithm ensures fair and exciting Secret Santa matches. No one gets themselves!
            </p>
          </div>

          <div className="feature-card animate-entrance-stagger-3">
            <Calendar className="feature-icon gold" />
            <h3 className="feature-title">Scheduled Reveals</h3>
            <p className="feature-description">
              Set custom reveal dates and let the anticipation build. Perfect timing for your holiday celebrations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

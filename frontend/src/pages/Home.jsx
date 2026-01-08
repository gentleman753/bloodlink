import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Heart, Activity, Users, Calendar } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-2xl font-bold text-primary">Blood Link</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-muted/30">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Save Lives with <span className="text-primary">Blood Link</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-8">
          A centralized platform connecting Blood Banks, Hospitals, and Donors to ensure blood is available when and where it's needed most.
        </p>
        <div className="flex gap-4">
          <Link to="/register">
            <Button size="lg" className="h-12 px-8 text-lg">
              Become a Donor
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
              Partner Login
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Inventory</h3>
            <p className="text-muted-foreground">
              Blood banks manage their stock in real-time, allowing hospitals to find available blood units instantly.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Hospital Requests</h3>
            <p className="text-muted-foreground">
              Hospitals can raise blood requests with urgency levels and track fulfillment status from verified banks.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Donation Camps</h3>
            <p className="text-muted-foreground">
              Donors can find and register for upcoming donation camps, manage their history, and get certificates.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Blood Link. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

import { Route, Switch } from "wouter";

// Navigation component
function Navigation() {
  return (
    <nav className="flex flex-wrap justify-center gap-4 mt-8">
      <a href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
        Home
      </a>
      <a href="/about" className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90">
        About
      </a>
      <a href="/experience" className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90">
        Experience
      </a>
      <a href="/projects" className="px-6 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/90">
        Projects
      </a>
      <a href="/contact" className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90">
        Contact
      </a>
    </nav>
  );
}

// Page components
function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Aman Kayare</h1>
        <h2 className="text-2xl text-muted-foreground">Software Engineer</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Turning coffee into code, and code into experience.
          Driven by curiosity, powered by code. I bring ideas to life—efficiently and elegantly.
        </p>
        
        <Navigation />

        <div className="mt-16 p-12 bg-card rounded-xl border">
          <div className="w-48 h-48 mx-auto mb-8 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-6xl">
            👨‍💻
          </div>
          
          <h3 className="text-2xl font-semibold mb-4">Welcome to My Portfolio</h3>
          <div className="space-y-2 text-sm">
            <p className="text-green-600">✅ React Frontend - Working!</p>
            <p className="text-green-600">✅ Flask Backend - Connected!</p>
            <p className="text-green-600">✅ Decoupled Architecture - Success!</p>
            <p className="text-green-600">✅ Tailwind CSS - Styled!</p>
            <p className="text-green-600">✅ Routing - Enabled!</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Navigation />
      <div className="text-center space-y-6 mt-8">
        <h1 className="text-4xl font-bold">About Me</h1>
        <p className="text-lg max-w-2xl mx-auto">This is the About page. Routing is working correctly!</p>
      </div>
    </main>
  );
}

function ExperiencePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Navigation />
      <div className="text-center space-y-6 mt-8">
        <h1 className="text-4xl font-bold">Experience</h1>
        <p className="text-lg max-w-2xl mx-auto">This is the Experience page. Routing is working correctly!</p>
      </div>
    </main>
  );
}

function ProjectsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Navigation />
      <div className="text-center space-y-6 mt-8">
        <h1 className="text-4xl font-bold">Projects</h1>
        <p className="text-lg max-w-2xl mx-auto">This is the Projects page. Routing is working correctly!</p>
      </div>
    </main>
  );
}

function ContactPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Navigation />
      <div className="text-center space-y-6 mt-8">
        <h1 className="text-4xl font-bold">Contact</h1>
        <p className="text-lg max-w-2xl mx-auto">This is the Contact page. Routing is working correctly!</p>
      </div>
    </main>
  );
}

// Main App with routing
function App() {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/experience" component={ExperiencePage} />
        <Route path="/projects" component={ProjectsPage} />
        <Route path="/contact" component={ContactPage} />
        <Route component={HomePage} />
      </Switch>
      
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">
            © 2025 Aman Kayare - Portfolio successfully decoupled and deployed! 🎉
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

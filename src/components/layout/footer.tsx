export function Footer() {
  return (
    <footer className="border-t border-border/50">
      <div className="container mx-auto py-6 px-4 md:px-6">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Agilis. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

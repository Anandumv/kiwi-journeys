import PublicLayout from "./(public)/layout";
import PublicNotFound from "./(public)/not-found";

// Unmatched URLs render the public 404 with the site header and footer.
export default function NotFound() {
  return (
    <PublicLayout>
      <PublicNotFound />
    </PublicLayout>
  );
}

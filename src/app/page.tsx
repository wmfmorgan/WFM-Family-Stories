export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primaryPalette-50 to-secondaryPalette-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primaryPalette-800 mb-6">
            Family Stories
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A collaborative platform where family members can document and share
            their most cherished memories together.
          </p>
          <div className="space-x-4">
            <a href="/auth/signup" className="bg-primaryPalette-600 hover:bg-primaryPalette-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-block">
              Get Started
            </a>
            <a href="/auth/signin" className="border-2 border-primaryPalette-600 text-primaryPalette-600 hover:bg-primaryPalette-50 px-8 py-3 rounded-lg font-semibold transition-colors inline-block">
              Sign In
            </a>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-primaryPalette-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primaryPalette-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Family Collaboration</h3>
            <p className="text-gray-600">
              Invite family members to contribute their unique perspectives and memories to create complete stories.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-secondaryPalette-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-secondaryPalette-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Rich Media Support</h3>
            <p className="text-gray-600">
              Attach photos, videos, and documents to preserve the complete context of your family moments.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-warmPalette-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-warmPalette-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Timeline View</h3>
            <p className="text-gray-600">
              Organize your family history chronologically to see how your story unfolds over time.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

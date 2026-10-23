export default function BlogLoading() {
  return (
    <main aria-label="Loading blog" className="mx-auto flex min-h-[70vh] w-full max-w-[1140px] animate-pulse flex-col gap-10 px-4 py-12 md:px-8">
      <div className="mx-auto flex w-full max-w-[760px] flex-col items-center gap-4 py-8">
        <div className="h-7 w-36 rounded-full bg-orange-100" />
        <div className="h-10 w-3/4 rounded-lg bg-[#F2EDE8]" />
        <div className="h-4 w-2/3 rounded bg-[#F2EDE8]" />
      </div>
      <div className="h-12 w-full rounded-xl bg-[#F2EDE8]" />
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-72 rounded-2xl bg-[#F2EDE8]" />)}
      </div>
    </main>
  );
}

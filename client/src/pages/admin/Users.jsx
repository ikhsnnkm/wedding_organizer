import { useState, useEffect } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { adminService } from "../../services";

const ROLE_V = { admin: "info", vendor: "warning", customer: "success" };
const ROLE_L = { admin: "Admin", vendor: "Vendor", customer: "Customer" };

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [delModal, setDelModal] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  useEffect(() => {
    adminService
      .getUsers()
      .then((data) => {
        // Paginate response: { data: [...], links, meta }
        // Service helper sudah extract data.data, jadi terima langsung
        const arr = Array.isArray(data) ? data : data?.data || data || [];
        setUsers(arr);
      })
      .catch((err) => console.error("Users fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users
    .filter((u) => filter === "all" || u.role === filter)
    .filter(
      (u) =>
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()),
    );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function handleDelete() {
    try {
      await adminService.deleteUser(delModal.id);
      setUsers((p) => p.filter((u) => u.id !== delModal.id));
      setDelModal(null);
    } catch {}
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-dark)] mb-1">
          Kelola Pengguna
        </h1>
        <p className="text-sm text-[var(--color-slate)] font-[var(--font-sans)]">
          {users.length} pengguna terdaftar
        </p>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari nama atau email..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-[var(--color-cream-border)] bg-white text-sm font-[var(--font-sans)] outline-none focus:border-[var(--color-gold)] transition-colors"
        />
        {["all", "admin", "vendor", "customer"].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={[
              "px-3 py-2 text-xs uppercase tracking-widest font-[var(--font-sans)] border transition-all",
              filter === f
                ? "bg-[var(--color-dark)] text-[var(--color-cream)] border-[var(--color-dark)]"
                : "bg-white border-[var(--color-cream-border)] text-[var(--color-dark-muted)] hover:border-[var(--color-dark)]",
            ].join(" ")}
          >
            {f === "all" ? "Semua" : ROLE_L[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white border border-[var(--color-cream-border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-[var(--font-sans)]">
                <thead>
                  <tr className="bg-[var(--color-cream)] border-b border-[var(--color-cream-border)]">
                    {[
                      "Pengguna",
                      "Email",
                      "Role",
                      "No. HP",
                      "Bergabung",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--color-slate)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--color-cream-border)] last:border-0 hover:bg-[var(--color-cream)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-gold)] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[var(--color-dark)]">
                              {u.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-[var(--color-dark)]">
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-dark-muted)]">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ROLE_V[u.role]}>{ROLE_L[u.role]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate)]">
                        {u.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate)]">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("id-ID")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== "admin" && (
                          <button
                            onClick={() => setDelModal(u)}
                            className="text-xs text-red-400 hover:text-red-600 font-[var(--font-sans)] transition-colors"
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filtered.length === 0 && (
            <p className="text-center py-12 text-sm text-[var(--color-slate)] font-[var(--font-sans)]">
              Tidak ada pengguna ditemukan.
            </p>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    "w-8 h-8 text-xs font-[var(--font-sans)] border transition-all",
                    page === p
                      ? "bg-[var(--color-dark)] text-[var(--color-cream)] border-[var(--color-dark)]"
                      : "border-[var(--color-cream-border)] text-[var(--color-dark-muted)]",
                  ].join(" ")}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={!!delModal}
        onClose={() => setDelModal(null)}
        title="Hapus Pengguna"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDelModal(null)}>
              Batal
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        {delModal && (
          <p className="text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)]">
            Yakin menghapus pengguna <strong>{delModal.name}</strong>? Tindakan
            ini tidak dapat dibatalkan.
          </p>
        )}
      </Modal>
    </div>
  );
}

export default AdminUsers;

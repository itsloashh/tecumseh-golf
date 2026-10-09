"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, ImageAsset, ProductOption } from "@/lib/types";
import type { AdminProduct } from "@/lib/admin/queries";
import { bumpProduct, createUploadSlots, deleteCategory, deleteProduct, saveCategory, saveProduct, setProductFlags } from "@/app/admin/actions";
import { processImage, uploadProcessed } from "@/lib/admin/process-image";
import { centsToInput, money, parseMoney } from "@/lib/money";
import { src } from "@/lib/images";
import { ConfirmButton, Field, PageHead, Pill, Section, Sheet, TextArea, TextInput, Toggle, useAction, useToast } from "./kit";
import { IconMinus, IconPlus, IconSearch, IconX, ProductImage, SampleTag, cx } from "@/components/ui/primitives";

type Filter = "all" | "live" | "hidden" | "low" | "sample";
export type ProductAccess = { edit: boolean; prices: boolean; stock: boolean };

export function ProductsManager({ products, categories, access, lowAt }: { products: AdminProduct[]; categories: Category[]; access: ProductAccess; lowAt: number }) {
  const router = useRouter();
  const { run } = useAction();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [cat, setCat] = useState("all");
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);

  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("filter") as Filter | null;
    if (f) setFilter(f);
  }, []);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (filter === "live" && !p.published) return false;
      if (filter === "hidden" && p.published) return false;
      if (filter === "low" && !(p.stock != null && p.stock <= lowAt)) return false;
      if (filter === "sample" && !p.isSample) return false;
      return !n || `${p.name} ${p.brand}`.toLowerCase().includes(n);
    });
  }, [products, q, filter, cat, lowAt]);

  const flag = async (p: AdminProduct, f: Parameters<typeof setProductFlags>[1], msg: string) => {
    if (await run(setProductFlags(p.id, f), msg)) router.refresh();
  };

  return (
    <>
      <PageHead kicker="Catalogue" title="Products" sub={`${products.filter((p) => p.published).length} live · ${products.length} total`}
        action={access.edit ? <button onClick={() => setEditing("new")} className="btn btn-flag"><IconPlus size={18} /> Add product</button> : undefined} />
      {!access.edit && <p className="mt-4 rounded-xl bg-leaf px-4 py-3 text-[13.5px] text-green">You can update {[access.prices && "prices", access.stock && "stock"].filter(Boolean).join(" and ")} here. Other product details are managed by a manager or shop lead.</p>}

      <div className="mt-6 space-y-3">
        <label className="relative block">
          <IconSearch size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="field !rounded-full pl-10" type="search" />
        </label>
        <div className="rail flex gap-2 overflow-x-auto">
          {(["all", "live", "hidden", "low", "sample"] as Filter[]).map((f) => (
            <button key={f} className="chip !h-9 shrink-0" aria-pressed={filter === f} onClick={() => setFilter(f)}>{{ all: "All", live: "Live", hidden: "Hidden", low: "Low stock", sample: "Samples" }[f]}</button>
          ))}
          <span className="w-px shrink-0 bg-[var(--line-strong)]" />
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="field !h-9 !w-auto shrink-0 !rounded-full text-[14px]">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {list.map((p) => (
          <li key={p.id} className={cx("card flex items-center gap-3 p-2.5 pr-3", !p.published && "opacity-60")}>
            <button onClick={() => setEditing(p)} className="size-16 shrink-0 overflow-hidden rounded-xl" aria-label={`Edit ${p.name}`}><ProductImage product={p} sizes="64px" /></button>
            <button onClick={() => setEditing(p)} className="min-w-0 flex-1 text-left">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
                <span className="price text-ink">{money(p.priceCents)}</span>
                {p.compareAtCents ? <Pill tone="clay">Sale</Pill> : null}
                {p.condition === "used" && <Pill tone="ink">Used</Pill>}
                {p.featured && <Pill tone="flag">★ Featured</Pill>}
                {!p.published && <Pill>Hidden</Pill>}
                {p.isSample && <SampleTag />}
              </p>
            </button>
            {p.stock != null && access.stock ? (
              <div className="flex items-center rounded-full border-[1.5px] border-[var(--line-strong)]" aria-label="Stock">
                <button onClick={() => flag(p, { stock: Math.max(0, p.stock! - 1) }, "Stock updated")} className="grid size-9 place-items-center" aria-label="One less"><IconMinus size={15} /></button>
                <span className={cx("w-7 text-center text-[14px] font-bold tabular", p.stock! <= lowAt && "text-clay")}>{p.stock}</span>
                <button onClick={() => flag(p, { stock: p.stock! + 1 }, "Stock updated")} className="grid size-9 place-items-center" aria-label="One more"><IconPlus size={15} /></button>
              </div>
            ) : p.stock != null ? <span className={cx("text-[13px] font-semibold", p.stock <= lowAt && "text-clay")}>{p.stock} in stock</span> : <span className="hidden text-[12px] text-faint sm:block">Not tracked</span>}
          </li>
        ))}
        {!list.length && <li className="card p-8 text-center text-[14px] text-muted">No products match.</li>}
      </ul>

      {access.edit && <CategoryManager categories={categories} />}

      {editing && (
        <ProductEditor
          key={editing === "new" ? "new" : editing.id}
          product={editing === "new" ? null : editing}
          categories={categories}
          access={access}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
          onBump={async (id) => { if (await run(bumpProduct(id), "Moved to the front of the shop")) router.refresh(); }}
        />
      )}
    </>
  );
}

function ProductEditor({ product, categories, access, onClose, onSaved, onBump }: { product: AdminProduct | null; categories: Category[]; access: ProductAccess; onClose: () => void; onSaved: () => void; onBump: (id: string) => void }) {
  const lockDetails = !access.edit, lockPrice = !!product && !access.prices, lockStock = !!product && !access.stock;
  const toast = useToast();
  const { run, busy } = useAction();
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand === "Sample Brand" ? "" : product?.brand ?? "");
  const [category, setCategory] = useState(product?.category ?? categories[0]?.slug ?? "");
  const [condition, setCondition] = useState<"new" | "used">(product?.condition ?? "new");
  const [price, setPrice] = useState(centsToInput(product?.priceCents));
  const [compare, setCompare] = useState(centsToInput(product?.compareAtCents));
  const [track, setTrack] = useState(product ? product.stock != null : true);
  const [stock, setStock] = useState(String(product?.stock ?? 1));
  const [options, setOptions] = useState<{ name: string; values: string }[]>((product?.options ?? []).map((o) => ({ name: o.name, values: o.values.join(", ") })));
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<(ImageAsset & { preview?: string })[]>(product?.images ?? []);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [published, setPublished] = useState(product?.published ?? true);
  const [uploading, setUploading] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const f of Array.from(files).slice(0, 8 - images.length)) {
      setUploading((n) => n + 1);
      try {
        const img = await processImage(f);
        const key = await uploadProcessed(img, createUploadSlots);
        setImages((xs) => [...xs, { key, width: img.width, height: img.height, blur: img.blur, preview: img.previewUrl }]);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed", "error");
      } finally { setUploading((n) => n - 1); }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async () => {
    const priceCents = parseMoney(price);
    if (priceCents == null) { toast("Enter a price, like 49.99", "error"); return; }
    const opts: ProductOption[] = options.map((o) => ({ name: o.name.trim(), values: o.values.split(",").map((v) => v.trim()).filter(Boolean) })).filter((o) => o.name && o.values.length);
    const r = await run(saveProduct({
      id: product?.id, name, brand, category: category || null, condition, description, priceCents,
      compareAtCents: parseMoney(compare), stock: track ? Math.max(0, Math.round(Number(stock) || 0)) : null,
      options: opts, images: images.map(({ preview: _p, ...i }) => i), featured, published,
    }), product ? "Saved — live on the site" : "Product added");
    if (r) onSaved();
  };

  const del = async () => {
    if (product && (await run(deleteProduct(product.id), "Product deleted"))) onSaved();
  };

  const move = (i: number, d: -1 | 1) => setImages((xs) => {
    const j = i + d;
    if (j < 0 || j >= xs.length) return xs;
    const c = [...xs]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });

  return (
    <Sheet open onClose={onClose} title={product ? "Edit product" : "New product"}
      footer={
        <div className="flex items-center gap-2">
          {product && access.edit && <ConfirmButton onConfirm={del} busy={busy} />}
          {product && access.edit && <button onClick={() => onBump(product.id)} className="btn btn-ghost btn-sm hidden sm:inline-flex">Move to front</button>}
          <button onClick={save} disabled={busy || uploading > 0} className="btn btn-green ml-auto">{busy ? "Saving…" : uploading ? "Uploading…" : "Save"}</button>
        </div>
      }>
      <div className="space-y-6">
        {lockDetails && <p className="rounded-xl bg-leaf px-4 py-3 text-[13.5px] text-green">You can change {[access.prices && "the price", access.stock && "the stock count"].filter(Boolean).join(" and ")}. Everything else is read-only for your account.</p>}
        <fieldset disabled={lockDetails} className="space-y-6 disabled:opacity-60">
        <div>
          <span className="mb-2 block text-[13.5px] font-semibold">Photos <span className="font-normal text-faint">— first one is the cover</span></span>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {images.map((im, i) => (
              <div key={im.key} className="relative aspect-square overflow-hidden rounded-xl bg-sand">
                <img src={im.preview ?? src(im, 480)} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="label absolute left-1.5 top-1.5 rounded-full bg-ink px-1.5 py-0.5 !text-[9px] text-cream">Cover</span>}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid size-7 place-items-center rounded-full bg-paper/90 text-[13px] disabled:opacity-0" aria-label="Move left">←</button>
                  <button type="button" onClick={() => setImages((xs) => xs.filter((_, k) => k !== i))} className="grid size-7 place-items-center rounded-full bg-paper/90" aria-label="Remove photo"><IconX size={14} /></button>
                </div>
              </div>
            ))}
            {images.length < 8 && (
              <button type="button" onClick={() => fileRef.current?.click()} className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-[var(--line-strong)] text-muted hover:border-green hover:text-green">
                <span className="text-center text-[12.5px] font-semibold">{uploading ? "Uploading…" : <><IconPlus className="mx-auto" /> Add photo</>}</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
          <p className="mt-2 text-[12px] text-faint">Straight from your camera roll — photos are resized automatically.</p>
        </div>

        <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pro V1 Golf Balls — Dozen" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand"><TextInput value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Titleist, TaylorMade…" /></Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="field">
              <option value="">No category</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          </Field>
        </div>
        <div>
          <span className="mb-1.5 block text-[13.5px] font-semibold">Condition</span>
          <div className="flex gap-2">
            {(["new", "used"] as const).map((c) => <button key={c} type="button" className="chip !h-11 !rounded-xl" aria-pressed={condition === c} onClick={() => setCondition(c)}>{c === "new" ? "New" : "Pre-owned"}</button>)}
          </div>
        </div>
        </fieldset>
        <fieldset disabled={lockPrice} className="grid grid-cols-2 gap-4 disabled:opacity-60">
          <Field label="Price ($)"><TextInput inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="49.99" /></Field>
          <Field label="Was ($)" hint="optional — shows as sale"><TextInput inputMode="decimal" value={compare} onChange={(e) => setCompare(e.target.value)} placeholder="59.99" /></Field>
        </fieldset>
        <fieldset disabled={lockStock} className="space-y-2.5 disabled:opacity-60">
          <Toggle checked={track} onChange={setTrack} label="Track stock" sub="Counts down with each order; sells out at 0" />
          {track && <Field label="In stock"><TextInput inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/[^0-9]/g, ""))} /></Field>}
        </fieldset>
        <fieldset disabled={lockDetails} className="space-y-6 disabled:opacity-60">

        <div>
          <span className="mb-1.5 block text-[13.5px] font-semibold">Options <span className="font-normal text-faint">— sizes, hand, flex…</span></span>
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={i} className="flex gap-2">
                <TextInput className="!w-28 shrink-0" value={o.name} onChange={(e) => setOptions(options.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} placeholder="Size" />
                <TextInput value={o.values} onChange={(e) => setOptions(options.map((x, k) => (k === i ? { ...x, values: e.target.value } : x)))} placeholder="S, M, L, XL" />
                <button type="button" onClick={() => setOptions(options.filter((_, k) => k !== i))} className="grid size-12 shrink-0 place-items-center rounded-xl border-[1.5px] border-[var(--line-strong)] text-muted" aria-label="Remove option"><IconX size={16} /></button>
              </div>
            ))}
            <button type="button" onClick={() => setOptions([...options, { name: "", values: "" }])} className="btn btn-ghost btn-sm"><IconPlus size={16} /> Add option</button>
          </div>
        </div>

        <Field label="Description"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Specs, condition notes, what's included…" /></Field>
        <div className="space-y-2.5">
          <Toggle checked={featured} onChange={setFeatured} label="★ Feature on the homepage" />
          <Toggle checked={published} onChange={setPublished} label="Show in the shop" sub="Turn off to hide without deleting" />
        </div>
        </fieldset>
      </div>
    </Sheet>
  );
}

function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { run, busy } = useAction();
  const [label, setLabel] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const add = async () => {
    if (!label.trim()) return;
    if (await run(saveCategory({ label, order: (categories.at(-1)?.order ?? 0) + 1 }), "Category added")) { setLabel(""); router.refresh(); }
  };
  return (
    <Section title="Categories">
      <ul className="card divide-y divide-[var(--line)]">
        {categories.map((c) => (
          <li key={c.slug} className="flex items-center gap-2 p-2.5">
            <TextInput className="!h-10 flex-1" value={edits[c.slug] ?? c.label} onChange={(e) => setEdits({ ...edits, [c.slug]: e.target.value })} />
            {edits[c.slug] !== undefined && edits[c.slug] !== c.label && (
              <button disabled={busy} onClick={async () => { if (await run(saveCategory({ slug: c.slug, label: edits[c.slug], order: c.order }), "Renamed")) router.refresh(); }} className="btn btn-green btn-sm">Save</button>
            )}
            <ConfirmButton busy={busy} onConfirm={async () => { if (await run(deleteCategory(c.slug), "Category removed")) router.refresh(); }}>Remove</ConfirmButton>
          </li>
        ))}
        <li className="flex gap-2 p-2.5">
          <TextInput className="!h-10 flex-1" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="New category, e.g. Junior clubs" onKeyDown={(e) => e.key === "Enter" && add()} />
          <button onClick={add} disabled={busy || !label.trim()} className="btn btn-ghost btn-sm">Add</button>
        </li>
      </ul>
    </Section>
  );
}

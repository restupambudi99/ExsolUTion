import { BRAND_NAME } from "@/lib/studio-brand";
import { Fragment } from "react";

/** Keep the requested capitalization and yellow U/T consistent across logo surfaces. */
export default function BrandWordmark({ className = "" }: { className?: string }) {
  return <span className={`brand-wordmark ${className}`.trim()}>Exsol<span className="brand-yellow">U</span><span className="brand-yellow">T</span>ion</span>;
}

export function BrandMonogram() {
  return <span className="brand-monogram" role="img" aria-label={BRAND_NAME}><span aria-hidden="true">E<span className="brand-yellow">U</span><span className="brand-yellow">T</span></span></span>;
}

export function BrandText({ text }: { text: string }) {
  return <>{text.split(BRAND_NAME).map((part,index) => <Fragment key={index}>{index > 0 && <BrandWordmark />}{part}</Fragment>)}</>;
}

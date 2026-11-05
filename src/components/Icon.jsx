// Weather icons drawn as simple SVG shapes, so they're sharp at any size and need no image files.
// `name` is one of: sun, moon, partly, cloud, fog, drizzle, rain, storm, snow.

const Sun = ({ cx = 32, cy = 32, r = 11 }) => (
  <g className="i-sun">
    <circle cx={cx} cy={cy} r={r} />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return <line key={i} x1={cx + Math.cos(a) * (r + 5)} y1={cy + Math.sin(a) * (r + 5)} x2={cx + Math.cos(a) * (r + 10)} y2={cy + Math.sin(a) * (r + 10)} />;
    })}
  </g>
);

const Moon = () => <path className="i-moon" d="M40 14a18 18 0 1 0 10 28 15 15 0 0 1-10-28z" />;

const Cloud = ({ dy = 0, dark = false }) => (
  <path className={dark ? 'i-cloud dark' : 'i-cloud'} transform={`translate(0 ${dy})`}
    d="M18 46h28a10 10 0 0 0 0-20 14 14 0 0 0-26-3A10 10 0 0 0 18 46z" />
);

const Drops = ({ n = 3, long = false }) => (
  <g className="i-rain">
    {Array.from({ length: n }, (_, i) => <line key={i} x1={24 + i * 9} y1={50} x2={21 + i * 9} y2={long ? 60 : 56} />)}
  </g>
);

export default function Icon({ name, night = false, size = 48, title }) {
  let art;
  switch (name) {
    case 'sun': art = night ? <Moon /> : <Sun />; break;
    case 'partly': art = <>{night ? <g transform="translate(6 -8) scale(.8)"><Moon /></g> : <Sun cx={24} cy={22} r={9} />}<Cloud dy={4} /></>; break;
    case 'fog': art = <><Cloud dy={-4} /><g className="i-fog"><line x1="14" y1="50" x2="50" y2="50" /><line x1="18" y1="57" x2="46" y2="57" /></g></>; break;
    case 'drizzle': art = <><Cloud dy={-4} /><Drops n={2} /></>; break;
    case 'rain': art = <><Cloud dy={-4} dark /><Drops n={3} long /></>; break;
    case 'storm': art = <><Cloud dy={-4} dark /><path className="i-bolt" d="M34 44l-7 11h6l-3 9 10-13h-6l4-7z" /></>; break;
    case 'snow': art = <><Cloud dy={-4} /><g className="i-snow">{[22, 32, 42].map((x) => <circle key={x} cx={x} cy={54} r={2.4} />)}</g></>; break;
    default: art = <Cloud />;
  }
  return (
    <svg className="icon" viewBox="0 0 64 64" width={size} height={size} role={title ? 'img' : undefined}
      aria-label={title} aria-hidden={title ? undefined : true} focusable="false">{art}</svg>
  );
}

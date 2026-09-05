import svgPaths from "./svg-z0y43ewxuh";

function Group4() {
  return (
    <div className="absolute h-[512px] left-0 top-0 w-[206px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 206 512">
        <g id="Group 24">
          <path d={svgPaths.p298000} fill="var(--fill-0, #FF0000)" id="Rectangle 197" />
          <path d="M106 412H206V512H106V412Z" fill="var(--fill-0, #FF0000)" id="Rectangle 198" />
          <path d={svgPaths.p1d1561c0} fill="var(--fill-0, #FF0000)" id="Rectangle 200" />
          <path d={svgPaths.p2fbcbbf0} fill="var(--fill-0, #FF0000)" id="Rectangle 201" />
          <path d={svgPaths.p3435d8c0} fill="var(--fill-0, #FF0000)" id="Rectangle 202" />
        </g>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute h-[200px] left-0 top-0 w-[100px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 200">
        <g id="Group 18">
          <path d={svgPaths.p2d518d00} fill="var(--fill-0, #FF0000)" id="Rectangle 212" />
          <g id="Group 13">
            <rect fill="var(--fill-0, #FF0000)" height="100" id="Rectangle 158" width="100" y="100" />
            <path d={svgPaths.p21b2b340} fill="var(--fill-0, #1E1E1E)" id="Rectangle 159" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute bg-[red] left-0 size-[100px] top-0" />
      <div className="absolute bg-[red] h-[200px] left-0 top-0 w-[100px]" />
      <Group1 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute h-[306px] left-0 top-0 w-[196px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 196 306">
        <g id="Group 17">
          <path d={svgPaths.p291be380} fill="var(--fill-0, #FF0000)" id="Rectangle 214" />
          <rect fill="var(--fill-0, #FF0000)" height="100" id="Rectangle 216" transform="rotate(180 196 306)" width="90" x="196" y="306" />
          <g id="Group 16">
            <path d={svgPaths.p3cb31b00} fill="var(--fill-0, #FF0000)" id="Rectangle 215" />
            <g id="Group 14">
              <rect fill="var(--fill-0, #FF0000)" height="50" id="Rectangle 158" transform="rotate(-180 100 50)" width="100" x="100" y="50" />
              <path d={svgPaths.p155b6f00} fill="var(--fill-0, #1E1E1E)" id="Rectangle 159" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute h-[306px] left-0 top-0 w-[206px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 206 306">
        <g id="Group 23">
          <path d={svgPaths.p3ecab700} fill="var(--fill-0, #FF0000)" id="Rectangle 203" />
          <path d={svgPaths.p21ad8200} fill="var(--fill-0, #FF0000)" id="Rectangle 204" />
          <path d={svgPaths.p22eca400} fill="var(--fill-0, #FF0000)" id="Rectangle 205" />
          <path d={svgPaths.p2ccf8300} fill="var(--fill-0, #FF0000)" id="Rectangle 206" />
          <g id="Group 20">
            <path d={svgPaths.p25c0de00} fill="var(--fill-0, #FF0000)" id="Rectangle 209" />
            <g id="Group 15">
              <rect fill="var(--fill-0, #FF0000)" height="50" id="Rectangle 158" transform="matrix(1 -8.74228e-08 -8.74228e-08 -1 106 256)" width="100" />
              <path d={svgPaths.p28804c00} fill="var(--fill-0, #1E1E1E)" id="Rectangle 159" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

export default function Group5() {
  return (
    <div className="contents relative size-full">
      <div className="absolute left-0 size-[100px] top-0">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M0 0H100V100H0V0Z" fill="var(--fill-0, #FF0000)" id="Rectangle 199" />
        </svg>
      </div>
      <Group4 />
      <Group2 />
      <Group />
      <Group3 />
    </div>
  );
}
/**
 * Copyright 2025 RAIDS Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Ref, SVGProps, forwardRef } from 'react'

const SvgComponent = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.902 72.502" ref={ref} {...props}>
    <path
      fillRule="evenodd"
      d="M439.602 72.001h-78.4V.501h78.4v13h-62.4v15.8h56.6v13h-56.6v16.7h62.4v13Zm-161.7-35.3h-16.2V.501h88v36.2h-16.2v-23.2h-21.8v58.5h-16v-58.5h-17.8v23.2Zm-200.1 35.8h-37a68.827 68.827 0 0 1-11.467-.893q-6.261-1.06-11.245-3.376a32.001 32.001 0 0 1-7.588-4.881A29.195 29.195 0 0 1 1.54 48.686Q.218 43.878.032 38.114a59.32 59.32 0 0 1-.03-1.913 48.559 48.559 0 0 1 1.103-10.692q2.301-10.191 9.397-16.408A33.698 33.698 0 0 1 22.699 2.42Q30.489-.051 40.802.001l36 .2v12.8h-34.9a48.88 48.88 0 0 0-7.043.472q-3.536.516-6.384 1.597a19.169 19.169 0 0 0-5.873 3.431q-6.3 5.5-6.3 17.7a37.318 37.318 0 0 0 .526 6.498q1.295 7.306 5.774 11.252a19.488 19.488 0 0 0 6.49 3.689q2.929 1.032 6.55 1.492a49.8 49.8 0 0 0 6.26.369h35.9v13Zm26-.5h-16V.501h59.9a35.492 35.492 0 0 1 6.751.603q3.979.772 7.085 2.531a18.837 18.837 0 0 1 3.414 2.466 17.57 17.57 0 0 1 4.876 7.826q1.274 3.986 1.274 9.174 0 7.184-2.469 12.064a17.169 17.169 0 0 1-2.031 3.136 18.592 18.592 0 0 1-8.207 5.708 25.988 25.988 0 0 1-4.593 1.192l16.5 26.8h-18.2l-15.3-26.3h-33v26.3Zm362.8 0h-16V.501h59.9a35.492 35.492 0 0 1 6.751.603q3.979.772 7.085 2.531a18.837 18.837 0 0 1 3.414 2.466 17.57 17.57 0 0 1 4.876 7.826q1.274 3.986 1.274 9.174 0 7.184-2.469 12.064a17.169 17.169 0 0 1-2.031 3.136 18.592 18.592 0 0 1-8.207 5.708 25.988 25.988 0 0 1-4.593 1.192l16.5 26.8h-18.2l-15.3-26.3h-33v26.3Zm-272.1 0h-17.4l32.2-71.5h24.7l32.2 71.5h-17.4l-6.8-15.1h-40.7l-6.8 15.1Zm-48.7-58.5h-42v19.1l42 .1q3.138 0 5.233-1.119a7.102 7.102 0 0 0 1.517-1.081 6.409 6.409 0 0 0 1.553-2.363q.797-2.01.797-5.037a18.786 18.786 0 0 0-.166-2.593q-.411-2.935-1.837-4.507a5.283 5.283 0 0 0-.347-.35 7.604 7.604 0 0 0-2.916-1.629q-1.147-.358-2.529-.47a16.18 16.18 0 0 0-1.305-.051Zm362.8 0h-42v19.1l42 .1q3.138 0 5.233-1.119a7.102 7.102 0 0 0 1.517-1.081 6.409 6.409 0 0 0 1.553-2.363q.797-2.01.797-5.037a18.786 18.786 0 0 0-.166-2.593q-.411-2.935-1.837-4.507a5.283 5.283 0 0 0-.347-.35 7.604 7.604 0 0 0-2.916-1.629q-1.147-.358-2.529-.47a16.18 16.18 0 0 0-1.305-.051Zm-287.6-.5-13.9 30.9h29.1l-13.9-30.9h-1.3Z"
      fontSize={8}
      style={{
        fill: 'currentColor',
      }}
      vectorEffect="non-scaling-stroke"
    />
  </svg>
)
const CraterTextIcon = forwardRef(SvgComponent)
CraterTextIcon.displayName = 'CraterTextIcon'
export default CraterTextIcon

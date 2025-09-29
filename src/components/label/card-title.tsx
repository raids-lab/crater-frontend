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
import { LucideIcon } from 'lucide-react'

type CardTitleProps = React.HTMLAttributes<HTMLDivElement> & {
  icon: LucideIcon
}

const CardTitle = ({ children, ...props }: CardTitleProps) => {
  return (
    <div className="flex items-center gap-1.5 text-base font-semibold">
      <props.icon className="text-primary size-5" />
      {children}
    </div>
  )
}

export default CardTitle

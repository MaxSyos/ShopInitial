import React from "react";
import DateTimeDisplay from "./DateTimeDisplay";

interface Props {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
const ShowCounter: React.FC<Props> = ({ days, hours, minutes, seconds }) => {
  return (
    <div className="flex items-center absolute bottom-6 ltr:left-6 rtl:right-6 w-auto z-30">
      <DateTimeDisplay value={days} type={"days"} isDanger={days <= 3} />
      <p className="font-bold text-base text-palette-secondary mx-2">:</p>
      <DateTimeDisplay value={hours} type={"hours"} isDanger={false} />
      <p className="font-bold text-base text-palette-secondary mx-2">:</p>
      <DateTimeDisplay value={minutes} type={"mins"} isDanger={false} />
      <p className="font-bold text-base text-palette-secondary mx-2">:</p>
      <DateTimeDisplay value={seconds} type={"seconds"} isDanger={false} />
    </div>
  );
};

export default ShowCounter;

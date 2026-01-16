import { useEffect, useState, useMemo } from "react";

const getReturnValues = (countDown: number) => {
  // calculate time left
  const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

  return [days, hours, minutes, seconds];
};

const useCountdown = (targetDate: number) => {
  // `targetDate` representa número de dias a partir de agora
  const countDownDate = useMemo(() => {
    const now = Date.now();
    const expire = new Date(now);
    expire.setDate(expire.getDate() + (Number(targetDate) || 0));
    return expire.getTime();
  }, [targetDate]);

  const [countDown, setCountDown] = useState(
    countDownDate - Date.now()
  );

  useEffect(() => {
    let mounted = true;

    const update = () => {
      if (!mounted) return;
      setCountDown(countDownDate - Date.now());
    };

    // run immediately to avoid 1s delay
    update();

    const interval = setInterval(update, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [countDownDate]);

  return getReturnValues(countDown);
};

export { useCountdown };

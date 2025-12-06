import Link from "next/link";
import React from "react";
import { useDispatch } from "react-redux";
import { userInfoActions } from "../../../store/user-slice";
import { useLanguage } from "../../../hooks/useLanguage";
import { AiOutlineHeart } from "react-icons/ai";
import { IoLogOutOutline } from "react-icons/io5";
import { MdShoppingBag } from "react-icons/md";
import jsCookie from "js-cookie";

interface Props {
  onClose: () => void;
}
const UserAccountBox: React.FC<Props> = ({ onClose }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  function onLogoutClickHandler() {
    dispatch(userInfoActions.userLogout());
    jsCookie.remove("userInfo");
    onClose();
  }
  return (
    <div>
      <ul>
        <li className="my-1 py-1" onClick={onClose}>
          <Link href={'/profile'}>
            <a className="flex items-center hover:text-palette-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zM2 20a10 10 0 0120 0H2z" />
              </svg>
              <span className="font-normal rtl:mr-1 ltr:ml-1">Perfil</span>
            </a>
          </Link>
        </li>
        <li className="my-1 py-1" onClick={onClose}>
          <Link href={'/orders'}>
            <a className="flex items-center hover:text-palette-primary">
              <MdShoppingBag
                style={{
                  fontSize: "1.2rem",
                  width: "1.8rem",
                }}
              />
              <span className="font-normal rtl:mr-1 ltr:ml-1">
                Meus Pedidos
              </span>
            </a>
          </Link>
        </li>
        <li className="my-1 py-1" onClick={onClose}>
          <Link href={"/favorite"}>
            <a className="flex items-center hover:text-palette-primary">
              <AiOutlineHeart
                style={{
                  fontSize: "1.2rem",
                  width: "1.8rem",
                }}
              />
              <span className="font-normal rtl:mr-1 ltr:ml-1">
                {t.favorites}
              </span>
            </a>
          </Link>
        </li>
        <li className="my-1 py-1" onClick={onLogoutClickHandler}>
          <Link href={`/`}>
            <a className="flex items-center hover:text-palette-primary">
              <IoLogOutOutline
                style={{
                  fontSize: "1.5rem",
                  width: "1.8rem",
                }}
              />
              <span className="font-normal rtl:mr-1 ltr:ml-1">{t.logout}</span>
            </a>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default UserAccountBox;

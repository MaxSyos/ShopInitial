import React from "react";
import Favorites from "../components/favorite";
import Breadcrumb from "../components/UI/Breadcrumb";
import PrivateRoute from "../components/auth/PrivateRoute";
import Benefits from "../components/Benefits";

const favorite = () => {
  return (
    <PrivateRoute>
      <div>
        <Breadcrumb />
        <Favorites />
        <Benefits />
      </div>
    </PrivateRoute>
  );
};

export default favorite;
